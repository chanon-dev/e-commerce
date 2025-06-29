import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';

// Controllers
import { ReviewController } from './review.controller';
import { ReviewModerationController } from './review-moderation.controller';
import { ReviewAnalyticsController } from './review-analytics.controller';

// Services
import { ReviewService } from './review.service';
import { ReviewModerationService } from './review-moderation.service';
import { ReviewAnalyticsService } from './review-analytics.service';
import { ReviewValidationService } from './review-validation.service';
import { ReviewNotificationService } from './review-notification.service';
import { SentimentAnalysisService } from './sentiment-analysis.service';
import { SpamDetectionService } from './spam-detection.service';

// Repositories
import { ReviewRepository } from './repositories/review.repository';
import { ReviewVoteRepository } from './repositories/review-vote.repository';
import { ReviewReportRepository } from './repositories/review-report.repository';

// Entities
import { Review } from './entities/review.entity';
import { ReviewVote } from './entities/review-vote.entity';
import { ReviewReport } from './entities/review-report.entity';
import { ReviewMedia } from './entities/review-media.entity';
import { ReviewResponse } from './entities/review-response.entity';

// Processors
import { ReviewProcessor } from './processors/review.processor';
import { ModerationProcessor } from './processors/moderation.processor';
import { AnalyticsProcessor } from './processors/analytics.processor';

// Shared modules
import { UserModule } from '../user/user.module';
import { ProductModule } from '../product/product.module';
import { OrderModule } from '../order/order.module';
import { NotificationModule } from '../notification/notification.module';
import { EventsModule } from '../events/events.module';

// External service clients
import { UserServiceClient } from '../clients/user-service.client';
import { ProductServiceClient } from '../clients/product-service.client';
import { OrderServiceClient } from '../clients/order-service.client';
import { NotificationServiceClient } from '../clients/notification-service.client';

@Module({
  imports: [
    // Configuration
    ConfigModule,
    
    // Database
    TypeOrmModule.forFeature([
      Review,
      ReviewVote,
      ReviewReport,
      ReviewMedia,
      ReviewResponse,
    ]),
    
    // Caching
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: 'redis',
        host: configService.get<string>('REDIS_HOST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
        password: configService.get<string>('REDIS_PASSWORD'),
        db: configService.get<number>('REDIS_REVIEW_DB', 5),
        ttl: configService.get<number>('REVIEW_CACHE_TTL', 1800), // 30 minutes
        max: configService.get<number>('REVIEW_CACHE_MAX', 5000),
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
          db: configService.get<number>('REDIS_QUEUE_DB', 6),
        },
        defaultJobOptions: {
          removeOnComplete: 20,
          removeOnFail: 10,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }),
      inject: [ConfigService],
    }),
    
    // Queue registration
    BullModule.registerQueue(
      {
        name: 'review-processing',
        processors: [
          {
            name: 'validate-review',
            concurrency: 5,
          },
          {
            name: 'sentiment-analysis',
            concurrency: 3,
          },
          {
            name: 'spam-detection',
            concurrency: 3,
          },
        ],
      },
      {
        name: 'review-moderation',
        processors: [
          {
            name: 'auto-moderate',
            concurrency: 2,
          },
          {
            name: 'manual-review',
            concurrency: 1,
          },
        ],
      },
      {
        name: 'review-analytics',
        processors: [
          {
            name: 'calculate-metrics',
            concurrency: 2,
          },
          {
            name: 'generate-insights',
            concurrency: 1,
          },
        ],
      }
    ),
    
    // Shared modules
    UserModule,
    ProductModule,
    OrderModule,
    NotificationModule,
    EventsModule,
  ],
  
  controllers: [
    ReviewController,
    ReviewModerationController,
    ReviewAnalyticsController,
  ],
  
  providers: [
    // Core services
    ReviewService,
    ReviewModerationService,
    ReviewAnalyticsService,
    ReviewValidationService,
    ReviewNotificationService,
    SentimentAnalysisService,
    SpamDetectionService,
    
    // Repositories
    ReviewRepository,
    ReviewVoteRepository,
    ReviewReportRepository,
    
    // Queue processors
    ReviewProcessor,
    ModerationProcessor,
    AnalyticsProcessor,
    
    // External service clients
    UserServiceClient,
    ProductServiceClient,
    OrderServiceClient,
    NotificationServiceClient,
    
    // Configuration providers
    {
      provide: 'REVIEW_CONFIG',
      useFactory: (configService: ConfigService) => ({
        maxReviewLength: configService.get<number>('MAX_REVIEW_LENGTH', 5000),
        minReviewLength: configService.get<number>('MIN_REVIEW_LENGTH', 10),
        maxMediaFiles: configService.get<number>('MAX_REVIEW_MEDIA', 10),
        maxMediaSize: configService.get<number>('MAX_MEDIA_SIZE', 10485760), // 10MB
        allowedMediaTypes: configService.get<string>('ALLOWED_MEDIA_TYPES', 'image/jpeg,image/png,video/mp4').split(','),
        requirePurchaseVerification: configService.get<boolean>('REQUIRE_PURCHASE_VERIFICATION', true),
        enableAutoModeration: configService.get<boolean>('ENABLE_AUTO_MODERATION', true),
        moderationThreshold: configService.get<number>('MODERATION_THRESHOLD', 0.7),
        enableSentimentAnalysis: configService.get<boolean>('ENABLE_SENTIMENT_ANALYSIS', true),
        enableSpamDetection: configService.get<boolean>('ENABLE_SPAM_DETECTION', true),
      }),
      inject: [ConfigService],
    },
    
    // Moderation configuration
    {
      provide: 'MODERATION_CONFIG',
      useFactory: (configService: ConfigService) => ({
        autoApproveThreshold: configService.get<number>('AUTO_APPROVE_THRESHOLD', 0.9),
        autoRejectThreshold: configService.get<number>('AUTO_REJECT_THRESHOLD', 0.3),
        flaggedWordsFile: configService.get<string>('FLAGGED_WORDS_FILE', 'flagged-words.txt'),
        enableProfanityFilter: configService.get<boolean>('ENABLE_PROFANITY_FILTER', true),
        enableToxicityDetection: configService.get<boolean>('ENABLE_TOXICITY_DETECTION', true),
        toxicityThreshold: configService.get<number>('TOXICITY_THRESHOLD', 0.8),
        manualReviewQueue: configService.get<boolean>('MANUAL_REVIEW_QUEUE', true),
      }),
      inject: [ConfigService],
    },
    
    // Analytics configuration
    {
      provide: 'ANALYTICS_CONFIG',
      useFactory: (configService: ConfigService) => ({
        enableRealTimeAnalytics: configService.get<boolean>('ENABLE_REALTIME_ANALYTICS', true),
        analyticsRetentionDays: configService.get<number>('ANALYTICS_RETENTION_DAYS', 365),
        enableTrendAnalysis: configService.get<boolean>('ENABLE_TREND_ANALYSIS', true),
        enableSentimentTracking: configService.get<boolean>('ENABLE_SENTIMENT_TRACKING', true),
        enableCompetitorAnalysis: configService.get<boolean>('ENABLE_COMPETITOR_ANALYSIS', false),
        metricsUpdateInterval: configService.get<number>('METRICS_UPDATE_INTERVAL', 300000), // 5 minutes
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
        notificationService: configService.get<string>('NOTIFICATION_SERVICE_URL', 'http://notification-service:3011'),
      }),
      inject: [ConfigService],
    },
    
    // AI/ML service configuration
    {
      provide: 'AI_CONFIG',
      useFactory: (configService: ConfigService) => ({
        sentimentApiUrl: configService.get<string>('SENTIMENT_API_URL'),
        sentimentApiKey: configService.get<string>('SENTIMENT_API_KEY'),
        spamDetectionApiUrl: configService.get<string>('SPAM_DETECTION_API_URL'),
        spamDetectionApiKey: configService.get<string>('SPAM_DETECTION_API_KEY'),
        toxicityApiUrl: configService.get<string>('TOXICITY_API_URL'),
        toxicityApiKey: configService.get<string>('TOXICITY_API_KEY'),
        enableLocalModels: configService.get<boolean>('ENABLE_LOCAL_MODELS', false),
      }),
      inject: [ConfigService],
    },
    
    // Event configuration
    {
      provide: 'REVIEW_EVENTS',
      useValue: {
        REVIEW_CREATED: 'review.created',
        REVIEW_UPDATED: 'review.updated',
        REVIEW_DELETED: 'review.deleted',
        REVIEW_APPROVED: 'review.approved',
        REVIEW_REJECTED: 'review.rejected',
        REVIEW_FLAGGED: 'review.flagged',
        REVIEW_VOTED: 'review.voted',
        REVIEW_REPORTED: 'review.reported',
        REVIEW_RESPONDED: 'review.responded',
        SENTIMENT_ANALYZED: 'review.sentiment.analyzed',
        SPAM_DETECTED: 'review.spam.detected',
        METRICS_UPDATED: 'review.metrics.updated',
      },
    },
  ],
  
  exports: [
    // Export services for other modules
    ReviewService,
    ReviewAnalyticsService,
    ReviewValidationService,
    SentimentAnalysisService,
    
    // Export repositories
    ReviewRepository,
    ReviewVoteRepository,
    
    // Export external clients
    UserServiceClient,
    ProductServiceClient,
    OrderServiceClient,
  ],
})
export class ReviewModule {
  constructor(
    private readonly configService: ConfigService,
    private readonly reviewModerationService: ReviewModerationService,
    private readonly reviewAnalyticsService: ReviewAnalyticsService
  ) {}
  
  // Module initialization
  async onModuleInit() {
    console.log('⭐ Review Module initialized');
    
    // Validate configuration
    this.validateConfiguration();
    
    // Initialize moderation system
    await this.initializeModerationSystem();
    
    // Initialize analytics
    await this.initializeAnalytics();
    
    // Setup periodic tasks
    this.setupPeriodicTasks();
  }
  
  private validateConfiguration() {
    const requiredConfigs = [
      'MAX_REVIEW_LENGTH',
      'MIN_REVIEW_LENGTH',
    ];
    
    const missingConfigs = requiredConfigs.filter(
      config => !this.configService.get(config)
    );
    
    if (missingConfigs.length > 0) {
      console.warn(
        `⚠️ Using default configuration for: ${missingConfigs.join(', ')}`
      );
    }
  }
  
  private async initializeModerationSystem() {
    try {
      // Initialize moderation rules and filters
      await this.reviewModerationService.initialize();
      console.log('✅ Review moderation system initialized');
    } catch (error) {
      console.error('❌ Review moderation initialization failed:', error.message);
    }
  }
  
  private async initializeAnalytics() {
    try {
      // Initialize analytics system
      await this.reviewAnalyticsService.initialize();
      console.log('✅ Review analytics system initialized');
    } catch (error) {
      console.error('❌ Review analytics initialization failed:', error.message);
    }
  }
  
  private setupPeriodicTasks() {
    // Setup periodic analytics updates
    const metricsInterval = this.configService.get<number>('METRICS_UPDATE_INTERVAL', 300000);
    
    setInterval(async () => {
      try {
        await this.reviewAnalyticsService.updateMetrics();
        console.log('📊 Review metrics updated');
      } catch (error) {
        console.error('❌ Review metrics update failed:', error.message);
      }
    }, metricsInterval);
    
    // Setup periodic cleanup
    const cleanupInterval = this.configService.get<number>('CLEANUP_INTERVAL', 86400000); // 24 hours
    
    setInterval(async () => {
      try {
        await this.reviewModerationService.cleanupOldReports();
        console.log('🧹 Review cleanup completed');
      } catch (error) {
        console.error('❌ Review cleanup failed:', error.message);
      }
    }, cleanupInterval);
  }
}
