import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  async getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      version: '1.0.0',
    };
  }

  async getReadiness() {
    // Check if all required services are available
    const services = [
      'auth-service',
      'user-service',
      'product-service',
      'order-service',
      'payment-service',
      'cart-service',
      'inventory-service',
      'shipping-service',
      'promotion-service',
      'review-service',
      'notification-service',
      'admin-service',
    ];

    const serviceChecks = await Promise.allSettled(
      services.map(async (service) => {
        try {
          // In a real implementation, you would check if the service is reachable
          return { service, status: 'healthy' };
        } catch (error) {
          return { service, status: 'unhealthy', error: error.message };
        }
      })
    );

    const results = serviceChecks.map((check, index) => ({
      service: services[index],
      ...(check.status === 'fulfilled' ? check.value : { status: 'error' }),
    }));

    const allHealthy = results.every(result => result.status === 'healthy');

    return {
      status: allHealthy ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      services: results,
    };
  }

  async getLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
