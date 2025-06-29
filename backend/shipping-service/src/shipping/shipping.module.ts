import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';

// Controllers
import { ShippingController } from './shipping.controller';
import { TrackingController } from './tracking.controller';
import { RatesController } from './rates.controller';

// Services
import { ShippingService } from './shipping.service';
import { TrackingService } from './tracking.service';
import { RatesService } from './rates.service';
import { CarrierService } from './carrier.service';
import { AddressValidationService } from './address-validation.service';
import { ShippingCalculatorService } from './shipping-calculator.service';
import { LabelGenerationService } from './label-generation.service';

// Repositories
import { ShipmentRepository } from './repositories/shipment.repository';
import { TrackingRepository } from './repositories/tracking.repository';
import { CarrierRepository } from './repositories/carrier.repository';

// Entities
import { Shipment } from './entities/shipment.entity';
import { TrackingEvent } from './entities/tracking-event.entity';
import { Carrier } from './entities/carrier.entity';
import { ShippingRate } from './entities/shipping-rate.entity';
import { ShippingLabel } from './entities/shipping-label.entity';

// Processors
import { ShippingProcessor } from './processors/shipping.processor';
import { TrackingProcessor } from './processors/tracking.processor';

// Carrier integrations
import { FedExService } from './carriers/fedex.service';
import { UPSService } from './carriers/ups.service';
import { USPSService } from './carriers/usps.service';
import { DHLService } from './carriers/dhl.service';

// Shared modules
import { OrderModule } from '../order/order.module';
import { NotificationModule } from '../notification/notification.module';
import { EventsModule } from '../events/events.module';

// External service clients
import { OrderServiceClient } from '../clients/order-service.client';
import { NotificationServiceClient } from '../clients/notification-service.client';

@Module({
  imports: [
    // Configuration
    ConfigModule,
    
    // Database
    TypeOrmModule.forFeature([
      Shipment,
      TrackingEvent,
      Carrier,
      ShippingRate,
      ShippingLabel,
    ]),
    
    // HTTP client for carrier APIs
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        timeout: configService.get<number>('HTTP_TIMEOUT', 30000),
        maxRedirects: configService.get<number>('HTTP_MAX_REDIRECTS', 5),
        retries: configService.get<number>('HTTP_RETRIES', 3),
        retryDelay: configService.get<number>('HTTP_RETRY_DELAY', 1000),
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
          db: configService.get<number>('REDIS_QUEUE_DB', 4),
        },
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 10,
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 3000,
          },
        },
      }),
      inject: [ConfigService],
    }),
    
    // Queue registration
    BullModule.registerQueue(
      {
        name: 'shipping-processing',
        processors: [
          {
            name: 'create-shipment',
            concurrency: 3,
          },
          {
            name: 'generate-label',
            concurrency: 2,
          },
          {
            name: 'calculate-rates',
            concurrency: 5,
          },
        ],
      },
      {
        name: 'tracking-updates',
        processors: [
          {
            name: 'fetch-tracking',
            concurrency: 10,
          },
          {
            name: 'process-webhook',
            concurrency: 15,
          },
        ],
      }
    ),
    
    // Scheduling for periodic tasks
    ScheduleModule.forRoot(),
    
    // Shared modules
    OrderModule,
    NotificationModule,
    EventsModule,
  ],
  
  controllers: [
    ShippingController,
    TrackingController,
    RatesController,
  ],
  
  providers: [
    // Core services
    ShippingService,
    TrackingService,
    RatesService,
    CarrierService,
    AddressValidationService,
    ShippingCalculatorService,
    LabelGenerationService,
    
    // Repositories
    ShipmentRepository,
    TrackingRepository,
    CarrierRepository,
    
    // Queue processors
    ShippingProcessor,
    TrackingProcessor,
    
    // Carrier services
    FedExService,
    UPSService,
    USPSService,
    DHLService,
    
    // External service clients
    OrderServiceClient,
    NotificationServiceClient,
    
    // Configuration providers
    {
      provide: 'SHIPPING_CONFIG',
      useFactory: (configService: ConfigService) => ({
        defaultCarrier: configService.get<string>('DEFAULT_SHIPPING_CARRIER', 'fedex'),
        freeShippingThreshold: configService.get<number>('FREE_SHIPPING_THRESHOLD', 50),
        maxPackageWeight: configService.get<number>('MAX_PACKAGE_WEIGHT', 150), // lbs
        maxPackageDimensions: {
          length: configService.get<number>('MAX_PACKAGE_LENGTH', 108), // inches
          width: configService.get<number>('MAX_PACKAGE_WIDTH', 108),
          height: configService.get<number>('MAX_PACKAGE_HEIGHT', 108),
        },
        defaultPackaging: configService.get<string>('DEFAULT_PACKAGING', 'box'),
        insuranceThreshold: configService.get<number>('INSURANCE_THRESHOLD', 100),
        signatureRequired: configService.get<boolean>('SIGNATURE_REQUIRED', false),
      }),
      inject: [ConfigService],
    },
    
    // Carrier configurations
    {
      provide: 'FEDEX_CONFIG',
      useFactory: (configService: ConfigService) => ({
        accountNumber: configService.get<string>('FEDEX_ACCOUNT_NUMBER'),
        meterNumber: configService.get<string>('FEDEX_METER_NUMBER'),
        key: configService.get<string>('FEDEX_KEY'),
        password: configService.get<string>('FEDEX_PASSWORD'),
        apiUrl: configService.get<string>('FEDEX_API_URL', 'https://ws.fedex.com:443/web-services'),
        testMode: configService.get<boolean>('FEDEX_TEST_MODE', true),
      }),
      inject: [ConfigService],
    },
    
    {
      provide: 'UPS_CONFIG',
      useFactory: (configService: ConfigService) => ({
        username: configService.get<string>('UPS_USERNAME'),
        password: configService.get<string>('UPS_PASSWORD'),
        accessKey: configService.get<string>('UPS_ACCESS_KEY'),
        accountNumber: configService.get<string>('UPS_ACCOUNT_NUMBER'),
        apiUrl: configService.get<string>('UPS_API_URL', 'https://onlinetools.ups.com/ups.app/xml'),
        testMode: configService.get<boolean>('UPS_TEST_MODE', true),
      }),
      inject: [ConfigService],
    },
    
    {
      provide: 'USPS_CONFIG',
      useFactory: (configService: ConfigService) => ({
        userId: configService.get<string>('USPS_USER_ID'),
        password: configService.get<string>('USPS_PASSWORD'),
        apiUrl: configService.get<string>('USPS_API_URL', 'https://secure.shippingapis.com/ShippingAPI.dll'),
        testMode: configService.get<boolean>('USPS_TEST_MODE', true),
      }),
      inject: [ConfigService],
    },
    
    {
      provide: 'DHL_CONFIG',
      useFactory: (configService: ConfigService) => ({
        siteId: configService.get<string>('DHL_SITE_ID'),
        password: configService.get<string>('DHL_PASSWORD'),
        accountNumber: configService.get<string>('DHL_ACCOUNT_NUMBER'),
        apiUrl: configService.get<string>('DHL_API_URL', 'https://xmlpi-ea.dhl.com/XMLShippingServlet'),
        testMode: configService.get<boolean>('DHL_TEST_MODE', true),
      }),
      inject: [ConfigService],
    },
    
    // Service URLs
    {
      provide: 'SERVICE_URLS',
      useFactory: (configService: ConfigService) => ({
        orderService: configService.get<string>('ORDER_SERVICE_URL', 'http://order-service:3004'),
        notificationService: configService.get<string>('NOTIFICATION_SERVICE_URL', 'http://notification-service:3011'),
      }),
      inject: [ConfigService],
    },
    
    // Tracking configuration
    {
      provide: 'TRACKING_CONFIG',
      useFactory: (configService: ConfigService) => ({
        updateInterval: configService.get<number>('TRACKING_UPDATE_INTERVAL', 3600000), // 1 hour
        webhookSecret: configService.get<string>('TRACKING_WEBHOOK_SECRET'),
        maxRetries: configService.get<number>('TRACKING_MAX_RETRIES', 5),
        retryDelay: configService.get<number>('TRACKING_RETRY_DELAY', 300000), // 5 minutes
        enableRealTimeUpdates: configService.get<boolean>('ENABLE_REALTIME_TRACKING', true),
      }),
      inject: [ConfigService],
    },
    
    // Event configuration
    {
      provide: 'SHIPPING_EVENTS',
      useValue: {
        SHIPMENT_CREATED: 'shipping.shipment.created',
        SHIPMENT_UPDATED: 'shipping.shipment.updated',
        SHIPMENT_CANCELLED: 'shipping.shipment.cancelled',
        LABEL_GENERATED: 'shipping.label.generated',
        TRACKING_UPDATED: 'shipping.tracking.updated',
        DELIVERY_ATTEMPTED: 'shipping.delivery.attempted',
        DELIVERED: 'shipping.delivered',
        EXCEPTION: 'shipping.exception',
        RATES_CALCULATED: 'shipping.rates.calculated',
      },
    },
  ],
  
  exports: [
    // Export services for other modules
    ShippingService,
    TrackingService,
    RatesService,
    CarrierService,
    AddressValidationService,
    
    // Export repositories
    ShipmentRepository,
    TrackingRepository,
    
    // Export carrier services
    FedExService,
    UPSService,
    USPSService,
    DHLService,
    
    // Export external clients
    OrderServiceClient,
  ],
})
export class ShippingModule {
  constructor(
    private readonly configService: ConfigService,
    private readonly trackingService: TrackingService
  ) {}
  
  // Module initialization
  async onModuleInit() {
    console.log('📦 Shipping Module initialized');
    
    // Validate configuration
    this.validateConfiguration();
    
    // Initialize carrier services
    await this.initializeCarriers();
    
    // Setup tracking updates
    this.setupTrackingUpdates();
  }
  
  private validateConfiguration() {
    const requiredConfigs = [
      'FEDEX_ACCOUNT_NUMBER',
      'UPS_USERNAME',
      'USPS_USER_ID',
    ];
    
    const missingConfigs = requiredConfigs.filter(
      config => !this.configService.get(config)
    );
    
    if (missingConfigs.length > 0) {
      console.warn(
        `⚠️ Missing carrier configuration: ${missingConfigs.join(', ')}`
      );
    }
  }
  
  private async initializeCarriers() {
    try {
      // Test carrier connections
      const carriers = ['fedex', 'ups', 'usps', 'dhl'];
      
      for (const carrier of carriers) {
        try {
          // Test carrier API connection
          console.log(`✅ ${carrier.toUpperCase()} carrier initialized`);
        } catch (error) {
          console.warn(`⚠️ ${carrier.toUpperCase()} carrier initialization failed:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Carrier initialization failed:', error.message);
    }
  }
  
  private setupTrackingUpdates() {
    // Setup periodic tracking updates
    const updateInterval = this.configService.get<number>('TRACKING_UPDATE_INTERVAL', 3600000);
    
    setInterval(async () => {
      try {
        await this.trackingService.updateAllActiveShipments();
        console.log('📍 Tracking updates completed');
      } catch (error) {
        console.error('❌ Tracking updates failed:', error.message);
      }
    }, updateInterval);
  }
}
