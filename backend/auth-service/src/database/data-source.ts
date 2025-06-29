import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

// Load environment variables
config();

const configService = new ConfigService();

// Base configuration
const baseConfig: Partial<DataSourceOptions> = {
  type: 'postgres',
  synchronize: false, // Always false in production
  logging: configService.get('NODE_ENV') === 'development' ? ['query', 'error'] : ['error'],
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  subscribers: [__dirname + '/subscribers/*{.ts,.js}'],
  migrationsTableName: 'typeorm_migrations',
  migrationsRun: false, // Run migrations manually
  dropSchema: false,
  cache: {
    type: 'redis',
    options: {
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get('REDIS_PORT', 6379),
      password: configService.get('REDIS_PASSWORD'),
      db: configService.get('REDIS_CACHE_DB', 1),
    },
    duration: 30000, // 30 seconds
  },
  extra: {
    // Connection pool settings
    max: configService.get('DB_POOL_MAX', 20),
    min: configService.get('DB_POOL_MIN', 5),
    idle: configService.get('DB_POOL_IDLE', 10000),
    acquire: configService.get('DB_POOL_ACQUIRE', 60000),
    evict: configService.get('DB_POOL_EVICT', 1000),
    
    // PostgreSQL specific settings
    application_name: 'ecommerce-auth-service',
    statement_timeout: 30000,
    query_timeout: 30000,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    
    // SSL configuration for production
    ssl: configService.get('NODE_ENV') === 'production' ? {
      rejectUnauthorized: false,
    } : false,
  },
};

// Environment-specific configurations
const getDataSourceConfig = (): DataSourceOptions => {
  const environment = configService.get('NODE_ENV', 'development');
  
  switch (environment) {
    case 'production':
      return {
        ...baseConfig,
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        synchronize: false,
        logging: ['error'],
        ssl: {
          rejectUnauthorized: false,
        },
        extra: {
          ...baseConfig.extra,
          max: 50,
          min: 10,
          ssl: {
            rejectUnauthorized: false,
          },
        },
      } as DataSourceOptions;

    case 'staging':
      return {
        ...baseConfig,
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_NAME', 'ecommerce_auth_staging'),
        synchronize: false,
        logging: ['query', 'error', 'warn'],
        extra: {
          ...baseConfig.extra,
          max: 30,
          min: 5,
        },
      } as DataSourceOptions;

    case 'test':
      return {
        ...baseConfig,
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_NAME', 'ecommerce_auth_test'),
        synchronize: true, // OK for test environment
        logging: false,
        dropSchema: true, // Reset schema for each test run
        cache: false, // Disable cache for tests
        extra: {
          max: 5,
          min: 1,
        },
      } as DataSourceOptions;

    case 'development':
    default:
      return {
        ...baseConfig,
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_NAME', 'ecommerce_auth'),
        synchronize: configService.get('DB_SYNCHRONIZE', 'false') === 'true',
        logging: ['query', 'error', 'warn', 'info'],
        extra: {
          ...baseConfig.extra,
          max: 10,
          min: 2,
        },
      } as DataSourceOptions;
  }
};

// Create and export the data source
export const AppDataSource = new DataSource(getDataSourceConfig());

// Database connection helper
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private dataSource: DataSource;
  private isConnected = false;

  private constructor() {
    this.dataSource = AppDataSource;
  }

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.dataSource.initialize();
      this.isConnected = true;
      console.log('✅ Database connected successfully');
      
      // Run pending migrations in production
      if (configService.get('NODE_ENV') === 'production') {
        await this.runMigrations();
      }
      
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.dataSource.destroy();
      this.isConnected = false;
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Database disconnection failed:', error);
      throw error;
    }
  }

  async runMigrations(): Promise<void> {
    try {
      const migrations = await this.dataSource.runMigrations();
      if (migrations.length > 0) {
        console.log(`✅ Ran ${migrations.length} migrations:`, migrations.map(m => m.name));
      } else {
        console.log('📊 No pending migrations');
      }
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async revertLastMigration(): Promise<void> {
    try {
      await this.dataSource.undoLastMigration();
      console.log('✅ Last migration reverted');
    } catch (error) {
      console.error('❌ Migration revert failed:', error);
      throw error;
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return false;
    }
  }

  getDataSource(): DataSource {
    return this.dataSource;
  }

  isConnectionActive(): boolean {
    return this.isConnected && this.dataSource.isInitialized;
  }

  // Transaction helper
  async withTransaction<T>(
    operation: (manager: any) => Promise<T>
  ): Promise<T> {
    return this.dataSource.transaction(operation);
  }

  // Query helpers
  async query(sql: string, parameters?: any[]): Promise<any> {
    return this.dataSource.query(sql, parameters);
  }

  // Health check with detailed info
  async getHealthInfo(): Promise<{
    status: 'healthy' | 'unhealthy';
    database: {
      connected: boolean;
      type: string;
      host: string;
      database: string;
    };
    migrations: {
      executed: number;
      pending: number;
    };
    cache: {
      enabled: boolean;
      type: string;
    };
  }> {
    try {
      const isHealthy = await this.checkConnection();
      const executedMigrations = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM typeorm_migrations'
      );
      const pendingMigrations = await this.dataSource.showMigrations();

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        database: {
          connected: this.isConnectionActive(),
          type: this.dataSource.options.type,
          host: this.dataSource.options.host as string,
          database: this.dataSource.options.database as string,
        },
        migrations: {
          executed: parseInt(executedMigrations[0]?.count || '0'),
          pending: pendingMigrations ? pendingMigrations.length : 0,
        },
        cache: {
          enabled: !!this.dataSource.options.cache,
          type: typeof this.dataSource.options.cache === 'object' 
            ? (this.dataSource.options.cache as any).type 
            : 'none',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: {
          connected: false,
          type: 'unknown',
          host: 'unknown',
          database: 'unknown',
        },
        migrations: {
          executed: 0,
          pending: 0,
        },
        cache: {
          enabled: false,
          type: 'none',
        },
      };
    }
  }
}

// Export singleton instance
export const databaseConnection = DatabaseConnection.getInstance();

// Helper function for NestJS integration
export const createTypeOrmOptions = () => getDataSourceConfig();
