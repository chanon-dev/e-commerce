import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VaultConfigManager } from './vault-config';

export interface SecretCache {
  value: any;
  timestamp: number;
  ttl: number;
}

@Injectable()
export class VaultService implements OnModuleInit {
  private readonly logger = new Logger(VaultService.name);
  private vaultManager: VaultConfigManager;
  private secretCache: Map<string, SecretCache> = new Map();
  private readonly cacheTTL = 300000; // 5 minutes default

  constructor(private readonly configService: ConfigService) {
    this.vaultManager = VaultConfigManager.getInstance();
  }

  async onModuleInit() {
    try {
      const environment = this.configService.get<string>('NODE_ENV', 'development');
      await this.vaultManager.initialize(environment);
      
      // Pre-load critical secrets
      await this.preloadCriticalSecrets();
      
      this.logger.log('✅ Vault service initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Vault service:', error);
      
      // In development, continue without Vault
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn('⚠️ Running in development mode without Vault');
      } else {
        throw error;
      }
    }
  }

  // Get secret with caching
  async getSecret(path: string, mount: string = 'secret', useCache: boolean = true): Promise<any> {
    const cacheKey = `${mount}/${path}`;
    
    // Check cache first
    if (useCache && this.secretCache.has(cacheKey)) {
      const cached = this.secretCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < cached.ttl) {
        this.logger.debug(`📋 Retrieved secret from cache: ${path}`);
        return cached.value;
      } else {
        this.secretCache.delete(cacheKey);
      }
    }

    try {
      const secret = await this.vaultManager.getSecret(path, mount);
      
      // Cache the secret
      if (useCache) {
        this.secretCache.set(cacheKey, {
          value: secret,
          timestamp: Date.now(),
          ttl: this.cacheTTL,
        });
      }
      
      this.logger.debug(`🔐 Retrieved secret from Vault: ${path}`);
      return secret;
    } catch (error) {
      this.logger.error(`❌ Failed to get secret ${path}:`, error);
      
      // Fallback to environment variables in development
      if (process.env.NODE_ENV === 'development') {
        return this.getFallbackSecret(path);
      }
      
      throw error;
    }
  }

  // Set secret
  async setSecret(path: string, secrets: Record<string, any>, mount: string = 'secret'): Promise<void> {
    try {
      await this.vaultManager.setSecret(path, secrets, mount);
      
      // Invalidate cache
      const cacheKey = `${mount}/${path}`;
      this.secretCache.delete(cacheKey);
      
      this.logger.log(`✅ Secret set successfully: ${path}`);
    } catch (error) {
      this.logger.error(`❌ Failed to set secret ${path}:`, error);
      throw error;
    }
  }

  // Application-specific secret getters
  async getDatabaseConfig(): Promise<{
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  }> {
    const secrets = await this.getSecret('database/postgresql');
    return {
      host: secrets.host || process.env.DB_HOST || 'localhost',
      port: parseInt(secrets.port) || parseInt(process.env.DB_PORT || '5432'),
      username: secrets.username || process.env.DB_USERNAME || 'postgres',
      password: secrets.password || process.env.DB_PASSWORD || 'password',
      database: secrets.database || process.env.DB_NAME || 'ecommerce',
    };
  }

  async getRedisConfig(): Promise<{
    host: string;
    port: number;
    password?: string;
  }> {
    const secrets = await this.getSecret('cache/redis');
    return {
      host: secrets.host || process.env.REDIS_HOST || 'localhost',
      port: parseInt(secrets.port) || parseInt(process.env.REDIS_PORT || '6379'),
      password: secrets.password || process.env.REDIS_PASSWORD,
    };
  }

  async getJWTSecret(): Promise<string> {
    const secrets = await this.getSecret('auth/jwt');
    return secrets.secret || process.env.JWT_SECRET || 'dev-jwt-secret';
  }

  async getKafkaConfig(): Promise<{
    brokers: string[];
    username?: string;
    password?: string;
    ssl?: {
      ca: string;
      cert: string;
      key: string;
    };
  }> {
    const secrets = await this.getSecret('messaging/kafka');
    return {
      brokers: secrets.brokers || [process.env.KAFKA_BROKER_1 || 'localhost:9092'],
      username: secrets.username || process.env.KAFKA_SASL_USERNAME,
      password: secrets.password || process.env.KAFKA_SASL_PASSWORD,
      ssl: secrets.ssl ? {
        ca: secrets.ssl.ca || process.env.KAFKA_SSL_CA || '',
        cert: secrets.ssl.cert || process.env.KAFKA_SSL_CERT || '',
        key: secrets.ssl.key || process.env.KAFKA_SSL_KEY || '',
      } : undefined,
    };
  }

  async getPaymentConfig(provider: string): Promise<Record<string, any>> {
    const secrets = await this.getSecret(`payment/${provider}`);
    return secrets || {};
  }

  async getShippingConfig(carrier: string): Promise<Record<string, any>> {
    const secrets = await this.getSecret(`shipping/${carrier}`);
    return secrets || {};
  }

  async getKeycloakConfig(): Promise<{
    url: string;
    realm: string;
    clientId: string;
    clientSecret: string;
  }> {
    const secrets = await this.getSecret('auth/keycloak');
    return {
      url: secrets.url || process.env.KEYCLOAK_URL || 'http://localhost:8080',
      realm: secrets.realm || process.env.KEYCLOAK_REALM || 'ecommerce',
      clientId: secrets.clientId || process.env.KEYCLOAK_CLIENT_ID || 'ecommerce-client',
      clientSecret: secrets.clientSecret || process.env.KEYCLOAK_CLIENT_SECRET || 'dev-secret',
    };
  }

  async getEmailConfig(): Promise<{
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
    from: string;
  }> {
    const secrets = await this.getSecret('notification/email');
    return {
      smtp: {
        host: secrets.smtp?.host || process.env.SMTP_HOST || 'localhost',
        port: parseInt(secrets.smtp?.port) || parseInt(process.env.SMTP_PORT || '587'),
        secure: secrets.smtp?.secure || process.env.SMTP_SECURE === 'true',
        auth: {
          user: secrets.smtp?.user || process.env.SMTP_USER || '',
          pass: secrets.smtp?.pass || process.env.SMTP_PASS || '',
        },
      },
      from: secrets.from || process.env.EMAIL_FROM || 'noreply@ecommerce.com',
    };
  }

  // Utility methods
  async preloadCriticalSecrets(): Promise<void> {
    const criticalSecrets = [
      'database/postgresql',
      'cache/redis',
      'auth/jwt',
      'auth/keycloak',
      'messaging/kafka',
    ];

    const promises = criticalSecrets.map(async (path) => {
      try {
        await this.getSecret(path);
        this.logger.debug(`✅ Preloaded secret: ${path}`);
      } catch (error) {
        this.logger.warn(`⚠️ Failed to preload secret: ${path}`);
      }
    });

    await Promise.allSettled(promises);
    this.logger.log('📋 Critical secrets preloaded');
  }

  private getFallbackSecret(path: string): any {
    // Development fallbacks
    const fallbacks: Record<string, any> = {
      'database/postgresql': {
        host: 'localhost',
        port: '5432',
        username: 'postgres',
        password: 'password',
        database: 'ecommerce',
      },
      'cache/redis': {
        host: 'localhost',
        port: '6379',
      },
      'auth/jwt': {
        secret: 'dev-jwt-secret-change-in-production',
      },
      'auth/keycloak': {
        url: 'http://localhost:8080',
        realm: 'ecommerce',
        clientId: 'ecommerce-client',
        clientSecret: 'dev-secret',
      },
      'messaging/kafka': {
        brokers: ['localhost:9092'],
      },
    };

    const fallback = fallbacks[path];
    if (fallback) {
      this.logger.warn(`⚠️ Using fallback secret for: ${path}`);
      return fallback;
    }

    throw new Error(`No fallback available for secret: ${path}`);
  }

  // Cache management
  clearCache(): void {
    this.secretCache.clear();
    this.logger.log('🧹 Secret cache cleared');
  }

  getCacheStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.secretCache.size,
      keys: Array.from(this.secretCache.keys()),
    };
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    vault: any;
    cache: {
      size: number;
      hitRate?: number;
    };
  }> {
    try {
      const vaultHealth = await this.vaultManager.healthCheck();
      
      return {
        status: vaultHealth.status,
        vault: vaultHealth,
        cache: {
          size: this.secretCache.size,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        vault: { error: error.message },
        cache: {
          size: this.secretCache.size,
        },
      };
    }
  }

  // Secret rotation support
  async rotateSecret(path: string, newSecrets: Record<string, any>, mount: string = 'secret'): Promise<void> {
    try {
      // Set new secret
      await this.setSecret(path, newSecrets, mount);
      
      // Clear from cache to force refresh
      const cacheKey = `${mount}/${path}`;
      this.secretCache.delete(cacheKey);
      
      this.logger.log(`🔄 Secret rotated successfully: ${path}`);
    } catch (error) {
      this.logger.error(`❌ Failed to rotate secret ${path}:`, error);
      throw error;
    }
  }
}
