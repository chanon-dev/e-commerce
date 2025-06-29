import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';

// Controllers
import { AdminController } from './admin.controller';
import { DashboardController } from './dashboard.controller';
import { ReportsController } from './reports.controller';
import { SystemController } from './system.controller';
import { UserManagementController } from './user-management.controller';
import { ProductManagementController } from './product-management.controller';
import { OrderManagementController } from './order-management.controller';

// Services
import { AdminService } from './admin.service';
import { DashboardService } from './dashboard.service';
import { ReportsService } from './reports.service';
import { SystemService } from './system.service';
import { UserManagementService } from './user-management.service';
import { ProductManagementService } from './product-management.service';
import { OrderManagementService } from './order-management.service';
import { AnalyticsService } from './analytics.service';
import { AuditService } from './audit.service';
import { BackupService } from './backup.service';

// Repositories
import { AdminRepository } from './repositories/admin.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { SystemConfigRepository } from './repositories/system-config.repository';

// Entities
import { Admin } from './entities/admin.entity';
import { AuditLog } from './entities/audit-log.entity';
import { SystemConfig } from './entities/system-config.entity';
import { AdminSession } from './entities/admin-session.entity';
import { AdminRole } from './entities/admin-role.entity';
import { AdminPermission } from './entities/admin-permission.entity';

// Processors
import { ReportsProcessor } from './processors/reports.processor';
import { AnalyticsProcessor } from './processors/analytics.processor';
import { BackupProcessor } from './processors/backup.processor';

// Guards and Decorators
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminRolesGuard } from './guards/admin-roles.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';

// Shared modules
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { NotificationModule } from '../notification/notification.module';

// External service clients
import { UserServiceClient } from '../clients/user-service.client';
import { ProductServiceClient } from '../clients/product-service.client';
import { OrderServiceClient } from '../clients/order-service.client';
import { PaymentServiceClient } from '../clients/payment-service.client';
import { InventoryServiceClient } from '../clients/inventory-service.client';
import { ShippingServiceClient } from '../clients/shipping-service.client';
import { ReviewServiceClient } from '../clients/review-service.client';
import { PromotionServiceClient } from '../clients/promotion-service.client';

@Module({
  imports: [
    // Configuration
    ConfigModule,
    
    // Database
    TypeOrmModule.forFeature([
      Admin,
      AuditLog,
      SystemConfig,
      AdminSession,
      AdminRole,
      AdminPermission,
    ]),
    
    // Caching
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: 'redis',
        host: configService.get<string>('REDIS_HOST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
        password: configService.get<string>('REDIS_PASSWORD'),
        db: configService.get<number>('REDIS_ADMIN_DB', 7),
        ttl: configService.get<number>('ADMIN_CACHE_TTL', 900), // 15 minutes
        max: configService.get<number>('ADMIN_CACHE_MAX', 1000),
      }),
      inject: [ConfigService],
    }),
    
    // Queue Management
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_QUEUE_DB', 8),
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      }),
      inject: [ConfigService],
    }),
    
    // Queue registration
    BullModule.registerQueue(
      {
        name: 'admin-reports',
        processors: [
          {
            name: 'generate-report',
            concurrency: 2,
          },
          {
            name: 'export-data',
            concurrency: 1,
          },
        ],
      },
      {
        name: 'admin-analytics',
        processors: [
          {
            name: 'calculate-metrics',
            concurrency: 3,
          },
          {
            name: 'generate-insights',
            concurrency: 1,
          },
        ],
      },
      {
        name: 'admin-backup',
        processors: [
          {
            name: 'backup-database',
            concurrency: 1,
          },
          {
            name: 'backup-files',
            concurrency: 1,
          },
        ],
      }
    ),
    
    // Scheduling for periodic tasks
    ScheduleModule.forRoot(),
    
    // Shared modules
    AuthModule,
    EventsModule,
    NotificationModule,
  ],
  
  controllers: [
    AdminController,
    DashboardController,
    ReportsController,
    SystemController,
    UserManagementController,
    ProductManagementController,
    OrderManagementController,
  ],
  
  providers: [
    // Core services
    AdminService,
    DashboardService,
    ReportsService,
    SystemService,
    UserManagementService,
    ProductManagementService,
    OrderManagementService,
    AnalyticsService,
    AuditService,
    BackupService,
    
    // Repositories
    AdminRepository,
    AuditLogRepository,
    SystemConfigRepository,
    
    // Queue processors
    ReportsProcessor,
    AnalyticsProcessor,
    BackupProcessor,
    
    // Guards
    AdminAuthGuard,
    AdminRolesGuard,
    SuperAdminGuard,
    
    // External service clients
    UserServiceClient,
    ProductServiceClient,
    OrderServiceClient,
    PaymentServiceClient,
    InventoryServiceClient,
    ShippingServiceClient,
    ReviewServiceClient,
    PromotionServiceClient,
    
    // Configuration providers
    {
      provide: 'ADMIN_CONFIG',
      useFactory: (configService: ConfigService) => ({
        maxLoginAttempts: configService.get<number>('ADMIN_MAX_LOGIN_ATTEMPTS', 5),
        lockoutDuration: configService.get<number>('ADMIN_LOCKOUT_DURATION', 900000), // 15 minutes
        sessionTimeout: configService.get<number>('ADMIN_SESSION_TIMEOUT', 3600000), // 1 hour
        maxConcurrentSessions: configService.get<number>('ADMIN_MAX_CONCURRENT_SESSIONS', 3),
        requireTwoFactor: configService.get<boolean>('ADMIN_REQUIRE_2FA', true),
        passwordComplexity: {
          minLength: configService.get<number>('ADMIN_PASSWORD_MIN_LENGTH', 12),
          requireUppercase: configService.get<boolean>('ADMIN_PASSWORD_REQUIRE_UPPERCASE', true),
          requireLowercase: configService.get<boolean>('ADMIN_PASSWORD_REQUIRE_LOWERCASE', true),
          requireNumbers: configService.get<boolean>('ADMIN_PASSWORD_REQUIRE_NUMBERS', true),
          requireSpecialChars: configService.get<boolean>('ADMIN_PASSWORD_REQUIRE_SPECIAL', true),
        },
      }),
      inject: [ConfigService],
    },
    
    // Dashboard configuration
    {
      provide: 'DASHBOARD_CONFIG',
      useFactory: (configService: ConfigService) => ({
        refreshInterval: configService.get<number>('DASHBOARD_REFRESH_INTERVAL', 30000), // 30 seconds
        enableRealTimeUpdates: configService.get<boolean>('DASHBOARD_REALTIME_UPDATES', true),
        maxWidgets: configService.get<number>('DASHBOARD_MAX_WIDGETS', 20),
        defaultWidgets: configService.get<string>('DASHBOARD_DEFAULT_WIDGETS', 'sales,orders,users,inventory').split(','),
        enableCustomization: configService.get<boolean>('DASHBOARD_ENABLE_CUSTOMIZATION', true),
      }),
      inject: [ConfigService],
    },
    
    // Reports configuration
    {
      provide: 'REPORTS_CONFIG',
      useFactory: (configService: ConfigService) => ({
        maxReportSize: configService.get<number>('MAX_REPORT_SIZE', 104857600), // 100MB
        reportRetentionDays: configService.get<number>('REPORT_RETENTION_DAYS', 90),
        enableScheduledReports: configService.get<boolean>('ENABLE_SCHEDULED_REPORTS', true),
        supportedFormats: configService.get<string>('REPORT_FORMATS', 'pdf,excel,csv').split(','),
        maxConcurrentReports: configService.get<number>('MAX_CONCURRENT_REPORTS', 5),
        reportStoragePath: configService.get<string>('REPORT_STORAGE_PATH', '/tmp/reports'),
      }),
      inject: [ConfigService],
    },
    
    // System configuration
    {
      provide: 'SYSTEM_CONFIG',
      useFactory: (configService: ConfigService) => ({
        enableMaintenanceMode: configService.get<boolean>('ENABLE_MAINTENANCE_MODE', false),
        maintenanceMessage: configService.get<string>('MAINTENANCE_MESSAGE', 'System under maintenance'),
        enableSystemMonitoring: configService.get<boolean>('ENABLE_SYSTEM_MONITORING', true),
        monitoringInterval: configService.get<number>('MONITORING_INTERVAL', 60000), // 1 minute
        alertThresholds: {
          cpuUsage: configService.get<number>('CPU_ALERT_THRESHOLD', 80),
          memoryUsage: configService.get<number>('MEMORY_ALERT_THRESHOLD', 85),
          diskUsage: configService.get<number>('DISK_ALERT_THRESHOLD', 90),
          responseTime: configService.get<number>('RESPONSE_TIME_THRESHOLD', 5000),
        },
      }),
      inject: [ConfigService],
    },
    
    // Backup configuration
    {
      provide: 'BACKUP_CONFIG',
      useFactory: (configService: ConfigService) => ({
        enableAutoBackup: configService.get<boolean>('ENABLE_AUTO_BACKUP', true),
        backupInterval: configService.get<string>('BACKUP_INTERVAL', '0 2 * * *'), // Daily at 2 AM
        backupRetentionDays: configService.get<number>('BACKUP_RETENTION_DAYS', 30),
        backupStoragePath: configService.get<string>('BACKUP_STORAGE_PATH', '/backups'),
        enableCloudBackup: configService.get<boolean>('ENABLE_CLOUD_BACKUP', false),
        cloudBackupProvider: configService.get<string>('CLOUD_BACKUP_PROVIDER', 's3'),
        compressionLevel: configService.get<number>('BACKUP_COMPRESSION_LEVEL', 6),
      }),
      inject: [ConfigService],
    },
    
    // Service URLs
    {
      provide: 'SERVICE_URLS',
      useFactory: (configService: ConfigService) => ({
        userService: configService.get<string>('USER_SERVICE_URL', 'http://user-service:3002'),
        productService: configService.get<string>('PRODUCT_SERVICE_URL', 'http://product-service:3003'),
        orderService: configService.get<string>('ORDER_SERVICE_URL', 'http://order-service:3004'),
        paymentService: configService.get<string>('PAYMENT_SERVICE_URL', 'http://payment-service:3005'),
        inventoryService: configService.get<string>('INVENTORY_SERVICE_URL', 'http://inventory-service:3007'),
        shippingService: configService.get<string>('SHIPPING_SERVICE_URL', 'http://shipping-service:3008'),
        reviewService: configService.get<string>('REVIEW_SERVICE_URL', 'http://review-service:3010'),
        promotionService: configService.get<string>('PROMOTION_SERVICE_URL', 'http://promotion-service:3009'),
      }),
      inject: [ConfigService],
    },
    
    // Event configuration
    {
      provide: 'ADMIN_EVENTS',
      useValue: {
        ADMIN_LOGIN: 'admin.login',
        ADMIN_LOGOUT: 'admin.logout',
        ADMIN_ACTION: 'admin.action',
        SYSTEM_CONFIG_CHANGED: 'admin.system.config.changed',
        REPORT_GENERATED: 'admin.report.generated',
        BACKUP_COMPLETED: 'admin.backup.completed',
        MAINTENANCE_MODE_TOGGLED: 'admin.maintenance.toggled',
        USER_MANAGED: 'admin.user.managed',
        PRODUCT_MANAGED: 'admin.product.managed',
        ORDER_MANAGED: 'admin.order.managed',
      },
    },
  ],
  
  exports: [
    // Export services for other modules
    AdminService,
    AuditService,
    SystemService,
    AnalyticsService,
    
    // Export guards
    AdminAuthGuard,
    AdminRolesGuard,
    SuperAdminGuard,
    
    // Export repositories
    AdminRepository,
    AuditLogRepository,
    
    // Export external clients
    UserServiceClient,
    ProductServiceClient,
    OrderServiceClient,
  ],
})
export class AdminModule {
  constructor(
    private readonly configService: ConfigService,
    private readonly systemService: SystemService,
    private readonly backupService: BackupService,
    private readonly auditService: AuditService
  ) {}
  
  // Module initialization
  async onModuleInit() {
    console.log('👨‍💼 Admin Module initialized');
    
    // Validate configuration
    this.validateConfiguration();
    
    // Initialize system monitoring
    await this.initializeSystemMonitoring();
    
    // Setup scheduled tasks
    this.setupScheduledTasks();
    
    // Initialize audit logging
    await this.initializeAuditLogging();
  }
  
  private validateConfiguration() {
    const requiredConfigs = [
      'ADMIN_MAX_LOGIN_ATTEMPTS',
      'ADMIN_SESSION_TIMEOUT',
    ];
    
    const missingConfigs = requiredConfigs.filter(
      config => !this.configService.get(config)
    );
    
    if (missingConfigs.length > 0) {
      console.warn(
        `⚠️ Using default admin configuration for: ${missingConfigs.join(', ')}`
      );
    }
  }
  
  private async initializeSystemMonitoring() {
    try {
      // Initialize system monitoring
      await this.systemService.initializeMonitoring();
      console.log('✅ System monitoring initialized');
    } catch (error) {
      console.error('❌ System monitoring initialization failed:', error.message);
    }
  }
  
  private setupScheduledTasks() {
    // Setup automatic backups
    if (this.configService.get<boolean>('ENABLE_AUTO_BACKUP', true)) {
      this.backupService.scheduleBackups();
      console.log('📅 Automatic backups scheduled');
    }
    
    // Setup system cleanup tasks
    const cleanupInterval = this.configService.get<number>('CLEANUP_INTERVAL', 86400000); // 24 hours
    
    setInterval(async () => {
      try {
        await this.systemService.performCleanup();
        console.log('🧹 System cleanup completed');
      } catch (error) {
        console.error('❌ System cleanup failed:', error.message);
      }
    }, cleanupInterval);
  }
  
  private async initializeAuditLogging() {
    try {
      // Initialize audit logging system
      await this.auditService.initialize();
      console.log('✅ Audit logging initialized');
    } catch (error) {
      console.error('❌ Audit logging initialization failed:', error.message);
    }
  }
}
