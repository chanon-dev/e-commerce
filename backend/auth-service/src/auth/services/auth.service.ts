import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

import {
  UserSession,
  AuthProvider,
  PasswordReset,
  EmailVerification,
  SessionType,
  SessionStatus,
  AuthProviderType,
  ResetTokenStatus,
  VerificationTokenStatus,
} from '../entities';

import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  SocialAuthDto,
  AuthResponseDto,
  UserProfileDto,
} from '../dto/auth.dto';

import { UserService } from '../../user/services/user.service';
import { EmailService } from '../../common/services/email.service';
import { SmsService } from '../../common/services/sms.service';
import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    @InjectRepository(AuthProvider)
    private readonly authProviderRepository: Repository<AuthProvider>,
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
    @InjectRepository(EmailVerification)
    private readonly emailVerificationRepository: Repository<EmailVerification>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly cacheService: CacheService,
  ) {}

  async register(
    registerDto: RegisterDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthResponseDto> {
    this.logger.log(`Registration attempt for email: ${registerDto.email}`);

    // Check if user already exists
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if phone number is already used
    if (registerDto.phoneNumber) {
      const existingPhoneUser = await this.userService.findByPhoneNumber(
        registerDto.phoneNumber,
      );
      if (existingPhoneUser) {
        throw new ConflictException('User with this phone number already exists');
      }
    }

    // Hash password
    const hashedPassword = await this.hashPassword(registerDto.password);

    // Create user
    const user = await this.userService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Create local auth provider
    await this.createAuthProvider(user.id, AuthProviderType.LOCAL, {
      email: registerDto.email,
      hashedPassword,
    });

    // Send email verification
    await this.sendEmailVerification(user.id, registerDto.email);

    // Create session and return tokens
    const sessionData = {
      type: SessionType.WEB,
      deviceInfo: this.extractDeviceInfo(userAgent),
      ipAddress,
      userAgent,
    };

    return this.createAuthResponse(user, sessionData);
  }

  async login(
    loginDto: LoginDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthResponseDto> {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);

    // Find user
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Get auth provider
    const authProvider = await this.authProviderRepository.findOne({
      where: {
        userId: user.id,
        provider: AuthProviderType.LOCAL,
        isActive: true,
      },
    });

    if (!authProvider) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      authProvider.providerData.hashedPassword,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.userService.updateLastLogin(user.id);
    authProvider.updateLastLogin();
    await this.authProviderRepository.save(authProvider);

    // Create session
    const sessionData = {
      type: loginDto.sessionType || SessionType.WEB,
      deviceInfo: loginDto.deviceInfo || this.extractDeviceInfo(userAgent),
      ipAddress,
      userAgent,
    };

    return this.createAuthResponse(user, sessionData);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    const { refreshToken } = refreshTokenDto;

    // Find session by refresh token
    const session = await this.sessionRepository.findOne({
      where: { refreshToken, status: SessionStatus.ACTIVE },
    });

    if (!session || !session.isActive()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Get user
    const user = await this.userService.findById(session.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Update session last accessed
    session.updateLastAccessed();
    await this.sessionRepository.save(session);

    // Generate new tokens
    const payload = this.createJwtPayload(user);
    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = this.generateRefreshToken();

    // Update session with new tokens
    session.accessToken = accessToken;
    session.refreshToken = newRefreshToken;
    session.expiresAt = new Date(
      Date.now() + this.getRefreshTokenExpiryMs(),
    );
    await this.sessionRepository.save(session);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.getAccessTokenExpirySeconds(),
      tokenType: 'Bearer',
      user: this.mapUserToProfile(user),
    };
  }

  async logout(userId: string, sessionId?: string, allDevices = false): Promise<void> {
    if (allDevices) {
      // Revoke all user sessions
      await this.sessionRepository.update(
        { userId, status: SessionStatus.ACTIVE },
        { status: SessionStatus.REVOKED },
      );
    } else if (sessionId) {
      // Revoke specific session
      await this.sessionRepository.update(
        { id: sessionId, userId, status: SessionStatus.ACTIVE },
        { status: SessionStatus.REVOKED },
      );
    }

    // Clear cache
    await this.cacheService.del(`user:${userId}:sessions`);
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    const { email } = forgotPasswordDto;

    const user = await this.userService.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Check rate limiting
    const rateLimitKey = `password_reset:${email}`;
    const attempts = await this.cacheService.get(rateLimitKey);
    if (attempts && parseInt(attempts) >= 3) {
      throw new BadRequestException('Too many password reset attempts. Please try again later.');
    }

    // Invalidate existing reset tokens
    await this.passwordResetRepository.update(
      { userId: user.id, status: ResetTokenStatus.PENDING },
      { status: ResetTokenStatus.EXPIRED },
    );

    // Create new reset token
    const token = crypto.randomBytes(32).toString('hex');
    const resetToken = this.passwordResetRepository.create({
      userId: user.id,
      token,
      email,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      ipAddress,
      userAgent,
    });

    await this.passwordResetRepository.save(resetToken);

    // Send reset email
    await this.emailService.sendPasswordResetEmail(email, token);

    // Update rate limiting
    await this.cacheService.set(rateLimitKey, (parseInt(attempts || '0') + 1).toString(), 3600);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto;

    // Find reset token
    const resetToken = await this.passwordResetRepository.findOne({
      where: { token, status: ResetTokenStatus.PENDING },
    });

    if (!resetToken || !resetToken.isValid()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update auth provider
    await this.authProviderRepository.update(
      { userId: resetToken.userId, provider: AuthProviderType.LOCAL },
      { providerData: { hashedPassword } },
    );

    // Mark token as used
    resetToken.markAsUsed();
    await this.passwordResetRepository.save(resetToken);

    // Revoke all user sessions
    await this.sessionRepository.update(
      { userId: resetToken.userId, status: SessionStatus.ACTIVE },
      { status: SessionStatus.REVOKED },
    );

    // Clear cache
    await this.cacheService.del(`user:${resetToken.userId}:sessions`);
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    // Get auth provider
    const authProvider = await this.authProviderRepository.findOne({
      where: { userId, provider: AuthProviderType.LOCAL, isActive: true },
    });

    if (!authProvider) {
      throw new BadRequestException('Local authentication not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      authProvider.providerData.hashedPassword,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password
    authProvider.providerData = { hashedPassword };
    await this.authProviderRepository.save(authProvider);

    // Revoke all other sessions (keep current session active)
    // This would require session context to identify current session
  }

  async verifyEmail(token: string): Promise<void> {
    const verification = await this.emailVerificationRepository.findOne({
      where: { token, status: VerificationTokenStatus.PENDING },
    });

    if (!verification || !verification.isValid()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Mark email as verified
    await this.userService.verifyEmail(verification.userId);

    // Mark verification as completed
    verification.markAsVerified();
    await this.emailVerificationRepository.save(verification);
  }

  async resendEmailVerification(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return; // Don't reveal if email exists
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Check rate limiting
    const rateLimitKey = `email_verification:${email}`;
    const attempts = await this.cacheService.get(rateLimitKey);
    if (attempts && parseInt(attempts) >= 5) {
      throw new BadRequestException('Too many verification attempts. Please try again later.');
    }

    await this.sendEmailVerification(user.id, email);

    // Update rate limiting
    await this.cacheService.set(rateLimitKey, (parseInt(attempts || '0') + 1).toString(), 3600);
  }

  async socialAuth(
    socialAuthDto: SocialAuthDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthResponseDto> {
    const { provider, accessToken, userData } = socialAuthDto;

    // Verify social token and get user data
    const socialUserData = await this.verifySocialToken(provider, accessToken);

    // Find existing auth provider
    let authProvider = await this.authProviderRepository.findOne({
      where: { provider, providerId: socialUserData.id },
    });

    let user;

    if (authProvider) {
      // Existing social login
      user = await this.userService.findById(authProvider.userId);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      // Update provider data
      authProvider.updateLastLogin();
      authProvider.providerData = socialUserData;
      await this.authProviderRepository.save(authProvider);
    } else {
      // New social login - check if user exists by email
      user = await this.userService.findByEmail(socialUserData.email);

      if (user) {
        // Link social account to existing user
        authProvider = await this.createAuthProvider(user.id, provider, socialUserData);
      } else {
        // Create new user
        user = await this.userService.create({
          email: socialUserData.email,
          firstName: socialUserData.firstName || socialUserData.name?.split(' ')[0] || '',
          lastName: socialUserData.lastName || socialUserData.name?.split(' ').slice(1).join(' ') || '',
          profilePicture: socialUserData.picture,
          isEmailVerified: true, // Trust social provider
        });

        authProvider = await this.createAuthProvider(user.id, provider, socialUserData);
      }
    }

    // Update last login
    await this.userService.updateLastLogin(user.id);

    // Create session
    const sessionData = {
      type: socialAuthDto.sessionType || SessionType.WEB,
      deviceInfo: socialAuthDto.deviceInfo || this.extractDeviceInfo(userAgent),
      ipAddress,
      userAgent,
    };

    return this.createAuthResponse(user, sessionData);
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    return this.sessionRepository.find({
      where: { userId, status: SessionStatus.ACTIVE },
      order: { lastAccessedAt: 'DESC' },
    });
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId, status: SessionStatus.ACTIVE },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    session.revoke();
    await this.sessionRepository.save(session);
  }

  // Private helper methods
  private async createAuthResponse(
    user: any,
    sessionData: Partial<UserSession>,
  ): Promise<AuthResponseDto> {
    const payload = this.createJwtPayload(user);
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.generateRefreshToken();

    // Create session
    const session = this.sessionRepository.create({
      userId: user.id,
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + this.getRefreshTokenExpiryMs()),
      ...sessionData,
    });

    await this.sessionRepository.save(session);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getAccessTokenExpirySeconds(),
      tokenType: 'Bearer',
      user: this.mapUserToProfile(user),
    };
  }

  private createJwtPayload(user: any) {
    return {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles || [],
      permissions: user.permissions || [],
      isEmailVerified: user.isEmailVerified,
      iat: Math.floor(Date.now() / 1000),
    };
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  private extractDeviceInfo(userAgent: string): string {
    // Simple device detection - in production, use a proper library
    if (userAgent.includes('Mobile')) return 'Mobile Device';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux PC';
    return 'Unknown Device';
  }

  private async createAuthProvider(
    userId: string,
    provider: AuthProviderType,
    data: any,
  ): Promise<AuthProvider> {
    const authProvider = this.authProviderRepository.create({
      userId,
      provider,
      providerId: data.id || userId,
      email: data.email,
      displayName: data.name || data.displayName,
      firstName: data.firstName,
      lastName: data.lastName,
      profilePicture: data.picture || data.profilePicture,
      providerData: data,
    });

    return this.authProviderRepository.save(authProvider);
  }

  private async sendEmailVerification(userId: string, email: string): Promise<void> {
    // Invalidate existing tokens
    await this.emailVerificationRepository.update(
      { userId, status: VerificationTokenStatus.PENDING },
      { status: VerificationTokenStatus.EXPIRED },
    );

    // Create new verification token
    const token = crypto.randomBytes(32).toString('hex');
    const verification = this.emailVerificationRepository.create({
      userId,
      token,
      email,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await this.emailVerificationRepository.save(verification);

    // Send verification email
    await this.emailService.sendEmailVerification(email, token);
  }

  private async verifySocialToken(provider: AuthProviderType, token: string): Promise<any> {
    // Implementation would depend on the social provider
    // This is a placeholder - implement actual verification for each provider
    switch (provider) {
      case AuthProviderType.GOOGLE:
        return this.verifyGoogleToken(token);
      case AuthProviderType.FACEBOOK:
        return this.verifyFacebookToken(token);
      // Add other providers
      default:
        throw new BadRequestException('Unsupported social provider');
    }
  }

  private async verifyGoogleToken(token: string): Promise<any> {
    // Implement Google token verification
    // Use Google's token verification API
    throw new Error('Google token verification not implemented');
  }

  private async verifyFacebookToken(token: string): Promise<any> {
    // Implement Facebook token verification
    // Use Facebook's token verification API
    throw new Error('Facebook token verification not implemented');
  }

  private mapUserToProfile(user: any): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      profilePicture: user.profilePicture,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      roles: user.roles || [],
      permissions: user.permissions || [],
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  private getAccessTokenExpirySeconds(): number {
    return this.configService.get<number>('JWT_ACCESS_TOKEN_EXPIRY', 3600); // 1 hour
  }

  private getRefreshTokenExpiryMs(): number {
    return this.configService.get<number>('JWT_REFRESH_TOKEN_EXPIRY', 7 * 24 * 60 * 60 * 1000); // 7 days
  }
}
