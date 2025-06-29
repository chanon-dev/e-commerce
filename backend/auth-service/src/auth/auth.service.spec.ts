import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User, UserStatus } from '../user/entities/user.entity';
import { EventService } from '../events/event.service';
import { RegisterDto } from './dto/register.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let eventService: EventService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: '$2b$12$hashedpassword',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+1234567890',
    status: UserStatus.ACTIVE,
    emailVerified: true,
    emailVerificationToken: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    lastLoginAt: null,
    loginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    isLocked: false,
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockEventService = {
    emitUserRegistered: jest.fn(),
    emitUserLoggedIn: jest.fn(),
    emitEmailVerified: jest.fn(),
    emitPasswordResetRequested: jest.fn(),
    emitPasswordReset: jest.fn(),
    emitUserLoggedOut: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EventService,
          useValue: mockEventService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    eventService = module.get<EventService>(EventService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1234567890',
    };

    it('should register a new user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockEventService.emitUserRegistered).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'User registered successfully. Please check your email for verification.',
        userId: mockUser.id,
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
    });
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const plainPassword = 'Password123!';
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(mockUser.email, plainPassword);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, mockUser.password);
      expect(result).toEqual(expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      }));
      expect(result.password).toBeUndefined();
    });

    it('should return null for non-existent user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should throw UnauthorizedException for locked account', async () => {
      const lockedUser = { ...mockUser, lockedUntil: new Date(Date.now() + 3600000) };
      mockUserRepository.findOne.mockResolvedValue(lockedUser);

      await expect(service.validateUser(mockUser.email, 'password')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException for inactive account', async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.INACTIVE };
      mockUserRepository.findOne.mockResolvedValue(inactiveUser);

      await expect(service.validateUser(mockUser.email, 'password')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should return null for incorrect password', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(mockUser.email, 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const token = 'jwt-token';
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
      });
      expect(mockEventService.emitUserLoggedIn).toHaveBeenCalled();
      expect(result).toEqual({
        access_token: token,
        token_type: 'Bearer',
        expires_in: 3600,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
        },
      });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const token = 'verification-token';
      const userWithToken = { ...mockUser, emailVerificationToken: token, emailVerified: false };
      mockUserRepository.findOne.mockResolvedValue(userWithToken);
      mockUserRepository.save.mockResolvedValue({ ...userWithToken, emailVerified: true });

      const result = await service.verifyEmail(token);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { emailVerificationToken: token },
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockEventService.emitEmailVerified).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Email verified successfully',
      });
    });

    it('should throw BadRequestException for invalid token', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.forgotPassword(mockUser.email);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockEventService.emitPasswordResetRequested).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Password reset email sent',
      });
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.forgotPassword('nonexistent@example.com')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetToken = 'reset-token';
      const newPassword = 'NewPassword123!';
      const userWithToken = {
        ...mockUser,
        passwordResetToken: resetToken,
        passwordResetExpires: new Date(Date.now() + 3600000),
      };
      
      mockUserRepository.findOne.mockResolvedValue(userWithToken);
      mockUserRepository.save.mockResolvedValue(userWithToken);

      const result = await service.resetPassword(resetToken, newPassword);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { passwordResetToken: resetToken },
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockEventService.emitPasswordReset).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Password reset successfully',
      });
    });

    it('should throw BadRequestException for invalid or expired token', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.resetPassword('invalid-token', 'newpassword')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException for expired token', async () => {
      const expiredUser = {
        ...mockUser,
        passwordResetToken: 'valid-token',
        passwordResetExpires: new Date(Date.now() - 3600000), // Expired
      };
      mockUserRepository.findOne.mockResolvedValue(expiredUser);

      await expect(service.resetPassword('valid-token', 'newpassword')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile(mockUser.id);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result.password).toBeUndefined();
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getProfile('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const result = await service.logout(mockUser.id);

      expect(mockEventService.emitUserLoggedOut).toHaveBeenCalledWith({
        userId: mockUser.id,
        logoutAt: expect.any(Date),
      });
      expect(result).toEqual({
        message: 'Logged out successfully',
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const newToken = 'new-jwt-token';
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(newToken);

      const result = await service.refreshToken(mockUser.id);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
      });
      expect(result).toEqual({
        access_token: newToken,
        token_type: 'Bearer',
        expires_in: 3600,
      });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshToken('non-existent-id')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});
