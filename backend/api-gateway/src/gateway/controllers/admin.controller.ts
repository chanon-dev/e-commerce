import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

import { AdminGuard } from '../guards/admin.guard';
import { ServiceRegistryService } from '../services/service-registry.service';
import { ProxyService } from '../services/proxy.service';
import { CircuitBreakerService } from '../services/circuit-breaker.service';
import { LoadBalancerService } from '../services/load-balancer.service';
import { CacheService } from '../services/cache.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly serviceRegistry: ServiceRegistryService,
    private readonly proxyService: ProxyService,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly loadBalancer: LoadBalancerService,
    private readonly cacheService: CacheService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Get overall system health' })
  @ApiResponse({
    status: 200,
    description: 'System health information',
  })
  async getSystemHealth() {
    const services = this.serviceRegistry.getAllServiceStatus();
    const circuitBreakers = this.circuitBreaker.getAllCircuitBreakerStatus();
    const loadBalancerStats = this.loadBalancer.getLoadBalancerStats();

    const healthyServices = services.filter(s => s.status === 'healthy').length;
    const totalServices = services.length;
    const systemHealth = totalServices > 0 ? (healthyServices / totalServices) * 100 : 0;

    return {
      success: true,
      data: {
        systemHealth: Math.round(systemHealth),
        totalServices,
        healthyServices,
        unhealthyServices: totalServices - healthyServices,
        services,
        circuitBreakers,
        loadBalancer: loadBalancerStats,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('services')
  @ApiOperation({ summary: 'Get all registered services' })
  @ApiResponse({
    status: 200,
    description: 'List of all registered services',
  })
  async getServices() {
    const services = this.serviceRegistry.getAllServices();
    const serviceStatus = this.serviceRegistry.getAllServiceStatus();

    const servicesWithStatus = services.map(service => {
      const status = serviceStatus.find(s => s.name === service.name);
      return {
        ...service,
        status: status?.status || 'unknown',
        lastCheck: status?.lastCheck,
        responseTime: status?.responseTime,
        error: status?.error,
      };
    });

    return {
      success: true,
      data: servicesWithStatus,
    };
  }

  @Get('services/:serviceName')
  @ApiOperation({ summary: 'Get specific service details' })
  @ApiParam({ name: 'serviceName', description: 'Name of the service' })
  @ApiResponse({
    status: 200,
    description: 'Service details',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  async getService(@Param('serviceName') serviceName: string) {
    const service = this.serviceRegistry.getService(serviceName);
    if (!service) {
      return {
        success: false,
        message: 'Service not found',
      };
    }

    const status = this.serviceRegistry.getServiceStatus(serviceName);
    const circuitBreakerStatus = this.circuitBreaker.getCircuitBreakerStatus(serviceName);
    const instances = this.loadBalancer.getServiceInstances(serviceName);

    return {
      success: true,
      data: {
        ...service,
        status,
        circuitBreaker: circuitBreakerStatus,
        instances,
      },
    };
  }

  @Post('services/:serviceName/health-check')
  @ApiOperation({ summary: 'Trigger manual health check for a service' })
  @ApiParam({ name: 'serviceName', description: 'Name of the service' })
  @HttpCode(HttpStatus.OK)
  async triggerHealthCheck(@Param('serviceName') serviceName: string) {
    const service = this.serviceRegistry.getService(serviceName);
    if (!service) {
      return {
        success: false,
        message: 'Service not found',
      };
    }

    try {
      const response = await this.proxyService.proxyGet(
        serviceName,
        service.healthEndpoint,
      );

      return {
        success: true,
        message: 'Health check completed',
        data: {
          status: response.status,
          responseTime: response.responseTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Health check failed',
        error: error.message,
      };
    }
  }

  @Get('circuit-breakers')
  @ApiOperation({ summary: 'Get all circuit breaker status' })
  @ApiResponse({
    status: 200,
    description: 'Circuit breaker status for all services',
  })
  async getCircuitBreakers() {
    const circuitBreakers = this.circuitBreaker.getAllCircuitBreakerStatus();
    const healthMetrics = this.circuitBreaker.getHealthMetrics();

    return {
      success: true,
      data: {
        circuitBreakers,
        healthMetrics,
      },
    };
  }

  @Post('circuit-breakers/:serviceName/reset')
  @ApiOperation({ summary: 'Reset circuit breaker for a service' })
  @ApiParam({ name: 'serviceName', description: 'Name of the service' })
  @HttpCode(HttpStatus.OK)
  async resetCircuitBreaker(@Param('serviceName') serviceName: string) {
    this.circuitBreaker.resetCircuitBreaker(serviceName);

    return {
      success: true,
      message: `Circuit breaker for ${serviceName} has been reset`,
    };
  }

  @Get('load-balancer')
  @ApiOperation({ summary: 'Get load balancer statistics' })
  @ApiResponse({
    status: 200,
    description: 'Load balancer statistics',
  })
  async getLoadBalancerStats() {
    const stats = this.loadBalancer.getLoadBalancerStats();
    const allInstances = this.loadBalancer.getAllServiceInstances();

    return {
      success: true,
      data: {
        stats,
        instances: allInstances,
        isHealthy: this.loadBalancer.isHealthy(),
      },
    };
  }

  @Post('load-balancer/:serviceName/instances')
  @ApiOperation({ summary: 'Add service instance' })
  @ApiParam({ name: 'serviceName', description: 'Name of the service' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', example: 'http://localhost:3001' },
        weight: { type: 'number', example: 1 },
      },
      required: ['url'],
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async addServiceInstance(
    @Param('serviceName') serviceName: string,
    @Body() body: { url: string; weight?: number },
  ) {
    this.loadBalancer.addServiceInstance(serviceName, body.url, body.weight || 1);

    return {
      success: true,
      message: `Instance added for ${serviceName}`,
    };
  }

  @Delete('load-balancer/:serviceName/instances')
  @ApiOperation({ summary: 'Remove service instance' })
  @ApiParam({ name: 'serviceName', description: 'Name of the service' })
  @ApiQuery({ name: 'url', description: 'Instance URL to remove' })
  @HttpCode(HttpStatus.OK)
  async removeServiceInstance(
    @Param('serviceName') serviceName: string,
    @Query('url') url: string,
  ) {
    this.loadBalancer.removeServiceInstance(serviceName, url);

    return {
      success: true,
      message: `Instance removed for ${serviceName}`,
    };
  }

  @Get('cache/stats')
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({
    status: 200,
    description: 'Cache statistics',
  })
  async getCacheStats() {
    const stats = await this.cacheService.getStats();

    return {
      success: true,
      data: stats,
    };
  }

  @Delete('cache')
  @ApiOperation({ summary: 'Clear all cache' })
  @ApiQuery({ name: 'pattern', description: 'Cache key pattern to clear', required: false })
  @HttpCode(HttpStatus.OK)
  async clearCache(@Query('pattern') pattern?: string) {
    if (pattern) {
      await this.cacheService.deletePattern(pattern);
      return {
        success: true,
        message: `Cache cleared for pattern: ${pattern}`,
      };
    } else {
      await this.cacheService.flushAll();
      return {
        success: true,
        message: 'All cache cleared',
      };
    }
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get gateway metrics' })
  @ApiResponse({
    status: 200,
    description: 'Gateway performance metrics',
  })
  async getMetrics() {
    // This would typically integrate with Prometheus or other metrics systems
    const services = this.serviceRegistry.getAllServiceStatus();
    const circuitBreakers = this.circuitBreaker.getHealthMetrics();
    const loadBalancer = this.loadBalancer.getLoadBalancerStats();

    const metrics = {
      gateway: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        timestamp: new Date().toISOString(),
      },
      services: services.reduce((acc, service) => {
        acc[service.name] = {
          status: service.status,
          responseTime: service.responseTime,
          lastCheck: service.lastCheck,
        };
        return acc;
      }, {} as Record<string, any>),
      circuitBreakers,
      loadBalancer,
    };

    return {
      success: true,
      data: metrics,
    };
  }

  @Post('warmup')
  @ApiOperation({ summary: 'Warm up all services' })
  @HttpCode(HttpStatus.OK)
  async warmupServices() {
    try {
      await this.proxyService.warmupServices();
      return {
        success: true,
        message: 'Service warmup completed',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Service warmup failed',
        error: error.message,
      };
    }
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get recent gateway logs' })
  @ApiQuery({ name: 'limit', description: 'Number of log entries', required: false })
  @ApiQuery({ name: 'level', description: 'Log level filter', required: false })
  @ApiResponse({
    status: 200,
    description: 'Recent log entries',
  })
  async getLogs(
    @Query('limit') limit: string = '100',
    @Query('level') level?: string,
  ) {
    // This would typically integrate with a logging system
    // For now, return a placeholder response
    return {
      success: true,
      data: {
        logs: [],
        total: 0,
        limit: parseInt(limit),
        level,
        message: 'Log integration not implemented yet',
      },
    };
  }

  @Get('config')
  @ApiOperation({ summary: 'Get gateway configuration' })
  @ApiResponse({
    status: 200,
    description: 'Gateway configuration',
  })
  async getConfig() {
    const services = this.serviceRegistry.getAllServices();

    return {
      success: true,
      data: {
        services: services.map(service => ({
          name: service.name,
          url: service.url,
          timeout: service.timeout,
          retries: service.retries,
          circuitBreaker: service.circuitBreaker,
        })),
        gateway: {
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          port: process.env.PORT || 8080,
        },
      },
    };
  }
}
