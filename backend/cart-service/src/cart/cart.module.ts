import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';

// Controllers
import { CartController } from './cart.controller';
import { CartItemController } from './cart-item.controller';

// Services
import { CartService } from './cart.service';
import { CartItemService } from './cart-item.service';
import { CartValidationService } from './cart-validation.service';
import { CartCalculationService } from './cart-calculation.service';
import { CartSyncService } from './cart-sync.service';

// Repositories
import { CartRepository } from './repositories/cart.repository';
import { CartItemRepository } from './repositories/cart-item.repository';

// Entities
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { SavedCart } from './entities/saved-cart.entity';

// DTOs and Validators
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

// Processors
import { CartProcessor } from './processors/cart.processor';
import { CartSyncProcessor } from './processors/cart-sync.processor';

// Shared modules
import { ProductModule } from '../product/product.module';
import { UserModule } from '../user/user.module';
import { PromotionModule } from '../promotion/promotion.module';
import { EventsModule } from '../events/events.module';
import { RedisModule } from '../redis/redis.module';

// External services
import { ProductServiceClient } from '../clients/product-service.client';
import { PromotionServiceClient } from '../clients/promotion-service.client';
import { InventoryServiceClient } from '../clients/inventory-service.client';

@Module({
  imports: [
    // Configuration
    ConfigModule,
    
    // Database
    TypeOrmModule.forFeature([Cart, CartItem, SavedCart]),
    
    // Caching
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: 'redis',
        host: configService.get<string>('REDIS_HOST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
        password: configService.get<string>('REDIS_PASSWORD'),
        db: configService.get<number>('REDIS_CART_DB', 2),
        ttl: configService.get<number>('CART_CACHE_TTL', 3600), // 1 hour
        max: configService.get<number>('CART_CACHE_MAX', 1000),
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
          db: configService.get<number>('REDIS_QUEUE_DB', 3),
        },
        defaultJobOptions: {
          removeOnComplete: 10,
          removeOnFail: 5,
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
        name: 'cart-processing',
        processors: [
          {
            name: 'calculate-totals',
            concurrency: 5,
          },
          {
            name: 'validate-items',
            concurrency: 3,
          },
          {
            name: 'sync-inventory',
            concurrency: 2,
          },
        ],
      },
      {
        name: 'cart-sync',
        processors: [
          {
            name: 'sync-to-database',
            concurrency: 10,
          },
          {
            name: 'cleanup-expired',
            concurrency: 1,
          },
        ],
      }
    ),
    
    // Shared modules
    ProductModule,
    UserModule,
    PromotionModule,
    EventsModule,
    RedisModule,
  ],
  
  controllers: [
    CartController,
    CartItemController,
  ],
  
  providers: [
    // Core services
    CartService,
    CartItemService,
    CartValidationService,
    CartCalculationService,
    CartSyncService,
    
    // Repositories
    CartRepository,
    CartItemRepository,
    
    // Queue processors
    CartProcessor,
    CartSyncProcessor,
    
    // External service clients
    ProductServiceClient,
    PromotionServiceClient,
    InventoryServiceClient,
    
    // Configuration providers
    {
      provide: 'CART_CONFIG',
      useFactory: (configService: ConfigService) => ({
        maxItems: configService.get<number>('CART_MAX_ITEMS', 100),
        maxQuantityPerItem: configService.get<number>('CART_MAX_QUANTITY_PER_ITEM', 99),
        sessionTimeout: configService.get<number>('CART_SESSION_TIMEOUT', 1800000), // 30 minutes
        guestCartExpiry: configService.get<number>('GUEST_CART_EXPIRY', 86400000), // 24 hours
        savedCartExpiry: configService.get<number>('SAVED_CART_EXPIRY', 2592000000), // 30 days
        autoSaveInterval: configService.get<number>('CART_AUTO_SAVE_INTERVAL', 30000), // 30 seconds
      }),
      inject: [ConfigService],
    },
    
    // Validation rules
    {
      provide: 'CART_VALIDATION_RULES',
      useFactory: (configService: ConfigService) => ({
        validateInventory: configService.get<boolean>('CART_VALIDATE_INVENTORY', true),
        validatePricing: configService.get<boolean>('CART_VALIDATE_PRICING', true),
        validatePromotions: configService.get<boolean>('CART_VALIDATE_PROMOTIONS', true),
        allowBackorder: configService.get<boolean>('CART_ALLOW_BACKORDER', false),
        requireAuthentication: configService.get<boolean>('CART_REQUIRE_AUTH', false),
      }),
      inject: [ConfigService],
    },
    
    // Service URLs
    {
      provide: 'SERVICE_URLS',
      useFactory: (configService: ConfigService) => ({
        productService: configService.get<string>('PRODUCT_SERVICE_URL', 'http://product-service:3003'),
        inventoryService: configService.get<string>('INVENTORY_SERVICE_URL', 'http://inventory-service:3007'),
        promotionService: configService.get<string>('PROMOTION_SERVICE_URL', 'http://promotion-service:3009'),
        userService: configService.get<string>('USER_SERVICE_URL', 'http://user-service:3002'),
      }),
      inject: [ConfigService],
    },
    
    // Event configuration
    {
      provide: 'CART_EVENTS',
      useValue: {
        CART_CREATED: 'cart.created',
        CART_UPDATED: 'cart.updated',
        CART_CLEARED: 'cart.cleared',
        CART_ABANDONED: 'cart.abandoned',
        ITEM_ADDED: 'cart.item.added',
        ITEM_UPDATED: 'cart.item.updated',
        ITEM_REMOVED: 'cart.item.removed',
        TOTALS_CALCULATED: 'cart.totals.calculated',
        PROMOTION_APPLIED: 'cart.promotion.applied',
        PROMOTION_REMOVED: 'cart.promotion.removed',
      },
    },
  ],
  
  exports: [
    // Export services for other modules
    CartService,
    CartItemService,
    CartValidationService,
    CartCalculationService,
    
    // Export repositories
    CartRepository,
    CartItemRepository,
    
    // Export external clients
    ProductServiceClient,
    InventoryServiceClient,
    PromotionServiceClient,
  ],
})
export class CartModule {
  constructor(
    private readonly configService: ConfigService,
    private readonly cartSyncService: CartSyncService
  ) {}
  
  // Module initialization
  async onModuleInit() {
    console.log('🛒 Cart Module initialized');
    
    // Validate configuration
    this.validateConfiguration();
    
    // Initialize cart sync
    await this.initializeCartSync();
    
    // Setup cleanup jobs
    this.setupCleanupJobs();
  }
  
  private validateConfiguration() {
    const requiredConfigs = [
      'REDIS_HOST',
      'PRODUCT_SERVICE_URL',
      'INVENTORY_SERVICE_URL',
    ];
    
    const missingConfigs = requiredConfigs.filter(
      config => !this.configService.get(config)
    );
    
    if (missingConfigs.length > 0) {
      console.warn(
        `⚠️ Missing optional configuration: ${missingConfigs.join(', ')}`
      );
    }
  }
  
  private async initializeCartSync() {
    try {
      // Start cart synchronization service
      await this.cartSyncService.initialize();
      console.log('✅ Cart synchronization initialized');
    } catch (error) {
      console.error('❌ Cart synchronization failed:', error.message);
    }
  }
  
  private setupCleanupJobs() {
    // Setup periodic cleanup of expired carts
    const cleanupInterval = this.configService.get<number>('CART_CLEANUP_INTERVAL', 3600000); // 1 hour
    
    setInterval(async () => {
      try {
        await this.cartSyncService.cleanupExpiredCarts();
        console.log('🧹 Expired carts cleaned up');
      } catch (error) {
        console.error('❌ Cart cleanup failed:', error.message);
      }
    }, cleanupInterval);
  }
}
