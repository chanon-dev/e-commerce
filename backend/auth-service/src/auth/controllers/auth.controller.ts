import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UsePipes,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { GetClientInfo } from '../decorators/client-info.decorator';

import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
  SocialAuthDto,
  LogoutDto,
  RevokeSessionDto,
  AuthResponseDto,
  UserProfileDto,
  SessionInfoDto,
  ApiResponseDto,
} from '../dto/auth.dto';

interface ClientInfo {
  ipAddress: string;
  userAgent: string;
}

@ApiTags('Authentication')
@Controller('auth')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle(5, 60) // 5 requests per minute
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: ApiResponseDto<AuthResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - user already exists',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @GetClientInfo() clientInfo: ClientInfo,
  ): Promise<ApiResponseDto<AuthResponseDto>> {
    try {
      this.logger.log(`Registration attempt for email: ${registerDto.email}`);
      
      const result = await this.authService.register(
        registerDto,
        clientInfo.ipAddress,
        clientInfo.userAgent,
      );

      return {
        success: true,
        message: 'User registered successfully. Please check your email for verification.',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Registration failed for ${registerDto.email}: ${error.message}`);
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle(10, 60) // 10 requests per minute
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: ApiResponseDto<AuthResponseDto>,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid credentials',
  })
  async login(
    @Body() loginDto: LoginDto,
    @GetClientInfo() clientInfo: ClientInfo,
  ): Promise<ApiResponseDto<AuthResponseDto>> {
    try {
      this.logger.log(`Login attempt for email: ${loginDto.email}`);
      
      const result = await this.authService.login(
        loginDto,
        clientInfo.ipAddress,
        clientInfo.userAgent,
      );

      return {
        success: true,
        message: 'Login successful',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Login failed for ${loginDto.email}: ${error.message}`);
      throw error;
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle(20, 60) // 20 requests per minute
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: ApiResponseDto<AuthResponseDto>,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid refresh token',
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<ApiResponseDto<AuthResponseDto>> {
    try {
      const result = await this.authService.refreshToken(refreshTokenDto);

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiBody({ type: LogoutDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    type: ApiResponseDto,
  })
  async logout(
    @CurrentUser() user: any,
    @Body() logoutDto: LogoutDto = {},
    @Req() req: Request,
  ): Promise<ApiResponseDto> {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      
      await this.authService.logout(user.sub, sessionId, logoutDto.allDevices);

      return {
        success: true,
        message: logoutDto.allDevices 
          ? 'Logged out from all devices successfully' 
          : 'Logout successful',
      };
    } catch (error) {
      this.logger.error(`Logout failed for user ${user.sub}: ${error.message}`);
      throw error;
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle(3, 60) // 3 requests per minute
  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent if user exists',
    type: ApiResponseDto,
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @GetClientInfo() clientInfo: ClientInfo,
  ): Promise<ApiResponseDto> {
    try {
      await this.authService.forgotPassword(
        forgotPasswordDto,
        clientInfo.ipAddress,
        clientInfo.userAgent,
      );

      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    } catch (error) {
      this.logger.error(`Password reset request failed: ${error.message}`);
      throw error;
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle(5, 60) // 5 requests per minute
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid or expired token',
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<ApiResponseDto> {
    try {
      await this.authService.resetPassword(resetPasswordDto);

      return {
        success: true,
        message: 'Password reset successful. Please login with your new password.',
      };
    } catch (error) {
      this.logger.error(`Password reset failed: ${error.message}`);
      throw error;
    }
  }

  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle(5, 60) // 5 requests per minute
  @ApiOperation({ summary: 'Change password (authenticated user)' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid current password',
  })
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<ApiResponseDto> {
    try {
      await this.authService.changePassword(user.sub, changePasswordDto);

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      this.logger.error(`Password change failed for user ${user.sub}: ${error.message}`);
      throw error;
    }
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid or expired token',
  })
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<ApiResponseDto> {
    try {
      await this.authService.verifyEmail(verifyEmailDto.token);

      return {
        success: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      this.logger.error(`Email verification failed: ${error.message}`);
      throw error;
    }
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle(3, 60) // 3 requests per minute
  @ApiOperation({ summary: 'Resend email verification' })
  @ApiBody({ type: ResendVerificationDto })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent if user exists',
    type: ApiResponseDto,
  })
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ): Promise<ApiResponseDto> {
    try {
      await this.authService.resendEmailVerification(resendVerificationDto.email);

      return {
        success: true,
        message: 'If an unverified account with that email exists, a verification email has been sent.',
      };
    } catch (error) {
      this.logger.error(`Resend verification failed: ${error.message}`);
      throw error;
    }
  }

  @Post('social')
  @HttpCode(HttpStatus.OK)
  @Throttle(10, 60) // 10 requests per minute
  @ApiOperation({ summary: 'Social authentication' })
  @ApiBody({ type: SocialAuthDto })
  @ApiResponse({
    status: 200,
    description: 'Social authentication successful',
    type: ApiResponseDto<AuthResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid social token',
  })
  async socialAuth(
    @Body() socialAuthDto: SocialAuthDto,
    @GetClientInfo() clientInfo: ClientInfo,
  ): Promise<ApiResponseDto<AuthResponseDto>> {
    try {
      const result = await this.authService.socialAuth(
        socialAuthDto,
        clientInfo.ipAddress,
        clientInfo.userAgent,
      );

      return {
        success: true,
        message: 'Social authentication successful',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Social auth failed for provider ${socialAuthDto.provider}: ${error.message}`);
      throw error;
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: ApiResponseDto<UserProfileDto>,
  })
  async getProfile(
    @CurrentUser() user: any,
  ): Promise<ApiResponseDto<UserProfileDto>> {
    return {
      success: true,
      message: 'User profile retrieved successfully',
      data: user,
    };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user sessions' })
  @ApiResponse({
    status: 200,
    description: 'User sessions retrieved successfully',
    type: ApiResponseDto<SessionInfoDto[]>,
  })
  async getSessions(
    @CurrentUser() user: any,
  ): Promise<ApiResponseDto<SessionInfoDto[]>> {
    try {
      const sessions = await this.authService.getUserSessions(user.sub);
      
      const sessionInfos = sessions.map(session => ({
        id: session.id,
        type: session.type,
        deviceInfo: session.deviceInfo,
        ipAddress: session.ipAddress,
        location: session.location,
        isActive: session.isActive(),
        createdAt: session.createdAt,
        lastAccessedAt: session.lastAccessedAt,
        expiresAt: session.expiresAt,
      }));

      return {
        success: true,
        message: 'User sessions retrieved successfully',
        data: sessionInfos,
      };
    } catch (error) {
      this.logger.error(`Get sessions failed for user ${user.sub}: ${error.message}`);
      throw error;
    }
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID to revoke' })
  @ApiResponse({
    status: 200,
    description: 'Session revoked successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  async revokeSession(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string,
  ): Promise<ApiResponseDto> {
    try {
      await this.authService.revokeSession(user.sub, sessionId);

      return {
        success: true,
        message: 'Session revoked successfully',
      };
    } catch (error) {
      this.logger.error(`Revoke session failed for user ${user.sub}: ${error.message}`);
      throw error;
    }
  }

  @Get('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate JWT token' })
  @ApiResponse({
    status: 200,
    description: 'Token is valid',
    type: ApiResponseDto<UserProfileDto>,
  })
  @ApiResponse({
    status: 401,
    description: 'Token is invalid or expired',
  })
  async validateToken(
    @CurrentUser() user: any,
  ): Promise<ApiResponseDto<UserProfileDto>> {
    return {
      success: true,
      message: 'Token is valid',
      data: user,
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  async healthCheck(): Promise<ApiResponseDto> {
    return {
      success: true,
      message: 'Auth service is healthy',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'auth-service',
        version: '1.0.0',
      },
    };
  }
}
