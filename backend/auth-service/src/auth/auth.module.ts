import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { AuthController } from './auth.controller';

// Services
import { AuthService } from './auth.service';
import { KeycloakService } from './keycloak.service';
import { TokenService } from './token.service';
import { PasswordService } from './password.service';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { KeycloakStrategy } from './strategies/keycloak.strategy';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RolesGuard } from './guards/roles.guard';

// Repositories
import { AuthRepository } from './repositories/auth.repository';
import { SessionRepository } from './repositories/session.repository';

// Entities
import { User } from '../user/entities/user.entity';
import { Session } from './entities/session.entity';
import { RefreshToken } from './entities/refresh-token.entity';

// Shared modules
import { UserModule } from '../user/user.module';
import { EventsModule } from '../events/events.module';
import { VaultModule } from '../vault/vault.module';

@Module({
  imports: [
    // Configuration
    ConfigModule,
    
    // Database
    TypeOrmModule.forFeature([User, Session, RefreshToken]),
    
    // Authentication
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    // JWT Configuration
    JwtModule.registerAsync({
      imports: [ConfigModule, VaultModule],
      useFactory: async (configService: ConfigService, vaultService: VaultService) => {
        // Get JWT secret from Vault
        const jwtSecret = await vaultService.getSecret('auth/jwt-secret');
        
        return {
          secret: jwtSecret || configService.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h'),
            issuer: configService.get<string>('JWT_ISSUER', 'ecommerce-platform'),
            audience: configService.get<string>('JWT_AUDIENCE', 'ecommerce-users'),
          },
        };
      },
      inject: [ConfigService, VaultService],
    }),
    
    // Shared modules
    UserModule,
    EventsModule,
    VaultModule,
  ],
  
  controllers: [
    AuthController,
  ],
  
  providers: [
    // Core services
    AuthService,
    KeycloakService,
    TokenService,
    PasswordService,
    
    // Strategies
    JwtStrategy,
    LocalStrategy,
    KeycloakStrategy,
    
    // Guards
    JwtAuthGuard,
    LocalAuthGuard,
    RolesGuard,
    
    // Repositories
    AuthRepository,
    SessionRepository,
    
    // Configuration providers
    {
      provide: 'KEYCLOAK_CONFIG',
      useFactory: (configService: ConfigService) => ({
        url: configService.get<string>('KEYCLOAK_URL'),
        realm: configService.get<string>('KEYCLOAK_REALM'),
        clientId: configService.get<string>('KEYCLOAK_CLIENT_ID'),
        clientSecret: configService.get<string>('KEYCLOAK_CLIENT_SECRET'),
      }),
      inject: [ConfigService],
    },
    
    // Custom providers
    {
      provide: 'PASSWORD_CONFIG',
      useFactory: (configService: ConfigService) => ({
        saltRounds: configService.get<number>('BCRYPT_SALT_ROUNDS', 12),
        minLength: configService.get<number>('PASSWORD_MIN_LENGTH', 8),
        requireUppercase: configService.get<boolean>('PASSWORD_REQUIRE_UPPERCASE', true),
        requireLowercase: configService.get<boolean>('PASSWORD_REQUIRE_LOWERCASE', true),
        requireNumbers: configService.get<boolean>('PASSWORD_REQUIRE_NUMBERS', true),
        requireSpecialChars: configService.get<boolean>('PASSWORD_REQUIRE_SPECIAL_CHARS', true),
      }),
      inject: [ConfigService],
    },
    
    // Session configuration
    {
      provide: 'SESSION_CONFIG',
      useFactory: (configService: ConfigService) => ({
        maxSessions: configService.get<number>('MAX_SESSIONS_PER_USER', 5),
        sessionTimeout: configService.get<number>('SESSION_TIMEOUT', 3600000), // 1 hour
        refreshTokenExpiry: configService.get<number>('REFRESH_TOKEN_EXPIRY', 604800000), // 7 days
        rememberMeExpiry: configService.get<number>('REMEMBER_ME_EXPIRY', 2592000000), // 30 days
      }),
      inject: [ConfigService],
    },
  ],
  
  exports: [
    // Export services for other modules
    AuthService,
    TokenService,
    KeycloakService,
    
    // Export guards for other modules
    JwtAuthGuard,
    RolesGuard,
    
    // Export JWT module for other modules
    JwtModule,
    
    // Export strategies
    JwtStrategy,
  ],
})
export class AuthModule {
  constructor(private readonly configService: ConfigService) {}
  
  // Module initialization
  async onModuleInit() {
    console.log('🔐 Auth Module initialized');
    
    // Validate required configuration
    this.validateConfiguration();
    
    // Initialize Keycloak connection
    await this.initializeKeycloak();
  }
  
  private validateConfiguration() {
    const requiredConfigs = [
      'JWT_SECRET',
      'KEYCLOAK_URL',
      'KEYCLOAK_REALM',
      'KEYCLOAK_CLIENT_ID',
      'KEYCLOAK_CLIENT_SECRET',
    ];
    
    const missingConfigs = requiredConfigs.filter(
      config => !this.configService.get(config)
    );
    
    if (missingConfigs.length > 0) {
      throw new Error(
        `Missing required configuration: ${missingConfigs.join(', ')}`
      );
    }
  }
  
  private async initializeKeycloak() {
    try {
      // Test Keycloak connection
      const keycloakUrl = this.configService.get<string>('KEYCLOAK_URL');
      const response = await fetch(`${keycloakUrl}/realms/ecommerce/.well-known/openid_configuration`);
      
      if (!response.ok) {
        throw new Error(`Keycloak connection failed: ${response.statusText}`);
      }
      
      console.log('✅ Keycloak connection established');
    } catch (error) {
      console.error('❌ Keycloak connection failed:', error.message);
      // Don't throw error to allow service to start without Keycloak
    }
  }
}
