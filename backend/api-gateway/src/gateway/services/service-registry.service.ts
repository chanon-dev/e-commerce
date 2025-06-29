import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface ServiceConfig {
  name: string;
  url: string;
  healthEndpoint: string;
  timeout: number;
  retries: number;
  circuitBreaker: {
    enabled: boolean;
    threshold: number;
    timeout: number;
  };
}

export interface ServiceStatus {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  responseTime: number;
  error?: string;
}

@Injectable()
export class ServiceRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ServiceRegistryService.name);
  private services: Map<string, ServiceConfig> = new Map();
  private serviceStatus: Map<string, ServiceStatus> = new Map();
  private healthCheckInterval: NodeJS.Timeout;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async onModuleInit() {
    this.initializeServices();
    this.startHealthChecks();
  }

  private initializeServices() {
    const services: ServiceConfig[] = [
      {
        name: 'auth-service',
        url: this.configService.get<string>('AUTH_SERVICE_URL', 'http://localhost:3001'),
        healthEndpoint: '/health',
        timeout: 5000,
        retries: 3,
        circuitBreaker: {
          enabled: true,
          threshold: 5,
          timeout: 30000,
        },
      },
      {
        name: 'user-service',
        url: this.configService.get<string>('USER_SERVICE_URL', 'http://localhost:3002'),
        healthEndpoint: '/health',
        timeout: 5000,
        retries: 3,
        circuitBreaker: {
          enabled: true,
          threshold: 5,
          timeout: 30000,
        },
      },
      {
        name: 'product-service',
        url: this.configService.get<string>('PRODUCT_SERVICE_URL', 'http://localhost:3003'),
        healthEndpoint: '/health',
        timeout: 5000,
        retries: 3,
        circuitBreaker: {
          enabled: true,
          threshold: 5,
          timeout: 30000,
        },
      },
      {
        name: 'order-service',
        url: this.configService.get<string>('ORDER_SERVICE_URL', 'http://localhost:3004'),
        healthEndpoint: '/health',
        timeout: 5000,
        retries: 3,
        circuitBreaker: {
          enabled: true,
          threshold: 5,
          timeout: 30000,
        },
      },
      {
        name: 'payment-service',
        url: this.configService.get<string>('PAYMENT_SERVICE_URL', 'http://localhost:3005'),
        healthEndpoint: '/health',
        timeout: 5000,
        retries: 3,
        circuitBreaker: {
          enabled: true,
          threshold: 5,
          timeout: 30000,
        },
      },
      {
        name: 'cart-service',
        url: this.configService.get<string>('CART_SERVICE_URL', 'http://localhost:3006'),
        healthEndpoint: '/health',
        timeout: 5000,
        retries: 3,
        circuitBreaker: {
          enabled: true,
          threshold: 5,
          timeout: 30000,
        },
      },
      {
        name: 'inventory-service',
        url: this.configService.get<string>('INVENTORY_SERVICE_URL', 'http://localhost:3007'),
        healthEndpoint: '/health',
        timeout: 5000,
        retries: 3,
        circuitBreaker: {
          enabled: true,
          threshold: 5,
          timeout: 30000,
        },
      },
      {
        name: 'notification-service',
        url: this.configService.get<string>('NOTIFICATION_SERVICE_URL', 'http://localhost:3011'),
        healthEndpoint: '/health',
        timeout: 5000,
        retries: 3,
        circuitBreaker: {
          enabled: true,
          threshold: 5,
          timeout: 30000,
        },
      },
    ];

    services.forEach(service => {
      this.services.set(service.name, service);
      this.serviceStatus.set(service.name, {
        name: service.name,
        url: service.url,
        status: 'unknown',
        lastCheck: new Date(),
        responseTime: 0,
      });
    });

    this.logger.log(`Registered ${services.length} services`);
  }

  private startHealthChecks() {
    // Initial health check
    this.performHealthChecks();

    // Schedule periodic health checks every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000);

    this.logger.log('Health check scheduler started');
  }

  private async performHealthChecks() {
    const promises = Array.from(this.services.values()).map(service =>
      this.checkServiceHealth(service),
    );

    await Promise.allSettled(promises);
  }

  private async checkServiceHealth(service: ServiceConfig): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${service.url}${service.healthEndpoint}`, {
          timeout: service.timeout,
        }),
      );

      const responseTime = Date.now() - startTime;

      this.serviceStatus.set(service.name, {
        name: service.name,
        url: service.url,
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        lastCheck: new Date(),
        responseTime,
      });

      this.logger.debug(`Health check passed for ${service.name} (${responseTime}ms)`);
    } catch (error) {
      const responseTime = Date.now() - startTime;

      this.serviceStatus.set(service.name, {
        name: service.name,
        url: service.url,
        status: 'unhealthy',
        lastCheck: new Date(),
        responseTime,
        error: error.message,
      });

      this.logger.warn(`Health check failed for ${service.name}: ${error.message}`);
    }
  }

  getService(name: string): ServiceConfig | undefined {
    return this.services.get(name);
  }

  getServiceUrl(name: string): string | undefined {
    const service = this.services.get(name);
    return service?.url;
  }

  getServiceStatus(name: string): ServiceStatus | undefined {
    return this.serviceStatus.get(name);
  }

  getAllServices(): ServiceConfig[] {
    return Array.from(this.services.values());
  }

  getAllServiceStatus(): ServiceStatus[] {
    return Array.from(this.serviceStatus.values());
  }

  isServiceHealthy(name: string): boolean {
    const status = this.serviceStatus.get(name);
    return status?.status === 'healthy';
  }

  getHealthyServices(): ServiceStatus[] {
    return Array.from(this.serviceStatus.values()).filter(
      status => status.status === 'healthy',
    );
  }

  getUnhealthyServices(): ServiceStatus[] {
    return Array.from(this.serviceStatus.values()).filter(
      status => status.status === 'unhealthy',
    );
  }

  async registerService(config: ServiceConfig): Promise<void> {
    this.services.set(config.name, config);
    this.serviceStatus.set(config.name, {
      name: config.name,
      url: config.url,
      status: 'unknown',
      lastCheck: new Date(),
      responseTime: 0,
    });

    // Perform immediate health check
    await this.checkServiceHealth(config);

    this.logger.log(`Service ${config.name} registered successfully`);
  }

  unregisterService(name: string): void {
    this.services.delete(name);
    this.serviceStatus.delete(name);
    this.logger.log(`Service ${name} unregistered`);
  }

  onModuleDestroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.logger.log('Health check scheduler stopped');
    }
  }
}
