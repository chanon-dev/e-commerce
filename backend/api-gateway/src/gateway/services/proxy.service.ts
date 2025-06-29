import {
  Injectable,
  Logger,
  BadGatewayException,
  ServiceUnavailableException,
  RequestTimeoutException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, retry, catchError } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

import { ServiceRegistryService } from './service-registry.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { LoadBalancerService } from './load-balancer.service';

export interface ProxyRequest {
  serviceName: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, any>;
  timeout?: number;
  retries?: number;
}

export interface ProxyResponse {
  data: any;
  status: number;
  headers: Record<string, string>;
  responseTime: number;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly defaultTimeout: number;
  private readonly defaultRetries: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly serviceRegistry: ServiceRegistryService,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly loadBalancer: LoadBalancerService,
  ) {
    this.defaultTimeout = this.configService.get<number>('PROXY_TIMEOUT', 10000);
    this.defaultRetries = this.configService.get<number>('PROXY_RETRIES', 3);
  }

  async proxyRequest(request: ProxyRequest): Promise<ProxyResponse> {
    const startTime = Date.now();

    try {
      // Get service configuration
      const service = this.serviceRegistry.getService(request.serviceName);
      if (!service) {
        throw new BadGatewayException(`Service ${request.serviceName} not found`);
      }

      // Check circuit breaker
      if (service.circuitBreaker.enabled) {
        const canExecute = await this.circuitBreaker.canExecute(request.serviceName);
        if (!canExecute) {
          throw new ServiceUnavailableException(
            `Service ${request.serviceName} is currently unavailable (circuit breaker open)`,
          );
        }
      }

      // Get service URL (with load balancing if multiple instances)
      const serviceUrl = await this.loadBalancer.getServiceUrl(request.serviceName);
      if (!serviceUrl) {
        throw new ServiceUnavailableException(`No healthy instances for service ${request.serviceName}`);
      }

      // Build request URL
      const url = `${serviceUrl}${request.path}`;

      // Prepare request configuration
      const config: AxiosRequestConfig = {
        method: request.method,
        url,
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-By': 'api-gateway',
          'X-Request-ID': this.generateRequestId(),
          ...request.headers,
        },
        timeout: request.timeout || service.timeout || this.defaultTimeout,
        params: request.query,
      };

      if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        config.data = request.body;
      }

      this.logger.debug(`Proxying ${request.method} ${url}`);

      // Make the request with retry logic
      const response = await firstValueFrom(
        this.httpService.request(config).pipe(
          timeout(config.timeout),
          retry({
            count: request.retries || service.retries || this.defaultRetries,
            delay: (error, retryCount) => {
              this.logger.warn(
                `Request to ${request.serviceName} failed (attempt ${retryCount}): ${error.message}`,
              );
              return retryCount * 1000; // Exponential backoff
            },
          }),
          catchError((error) => {
            // Record failure for circuit breaker
            if (service.circuitBreaker.enabled) {
              this.circuitBreaker.recordFailure(request.serviceName);
            }

            // Transform error
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
              throw new ServiceUnavailableException(
                `Service ${request.serviceName} is unavailable`,
              );
            }

            if (error.code === 'ETIMEDOUT' || error.name === 'TimeoutError') {
              throw new RequestTimeoutException(
                `Request to ${request.serviceName} timed out`,
              );
            }

            throw new BadGatewayException(
              `Error from ${request.serviceName}: ${error.message}`,
            );
          }),
        ),
      );

      // Record success for circuit breaker
      if (service.circuitBreaker.enabled) {
        this.circuitBreaker.recordSuccess(request.serviceName);
      }

      const responseTime = Date.now() - startTime;

      this.logger.debug(
        `Request to ${request.serviceName} completed in ${responseTime}ms (status: ${response.status})`,
      );

      return {
        data: response.data,
        status: response.status,
        headers: this.sanitizeHeaders(response.headers),
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      this.logger.error(
        `Request to ${request.serviceName} failed after ${responseTime}ms: ${error.message}`,
      );

      throw error;
    }
  }

  async proxyGet(
    serviceName: string,
    path: string,
    query?: Record<string, any>,
    headers?: Record<string, string>,
  ): Promise<ProxyResponse> {
    return this.proxyRequest({
      serviceName,
      path,
      method: 'GET',
      query,
      headers,
    });
  }

  async proxyPost(
    serviceName: string,
    path: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<ProxyResponse> {
    return this.proxyRequest({
      serviceName,
      path,
      method: 'POST',
      body,
      headers,
    });
  }

  async proxyPut(
    serviceName: string,
    path: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<ProxyResponse> {
    return this.proxyRequest({
      serviceName,
      path,
      method: 'PUT',
      body,
      headers,
    });
  }

  async proxyDelete(
    serviceName: string,
    path: string,
    headers?: Record<string, string>,
  ): Promise<ProxyResponse> {
    return this.proxyRequest({
      serviceName,
      path,
      method: 'DELETE',
      headers,
    });
  }

  async proxyPatch(
    serviceName: string,
    path: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<ProxyResponse> {
    return this.proxyRequest({
      serviceName,
      path,
      method: 'PATCH',
      body,
      headers,
    });
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeHeaders(headers: Record<string, any>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    // Only include safe headers
    const safeHeaders = [
      'content-type',
      'content-length',
      'cache-control',
      'etag',
      'last-modified',
      'x-request-id',
      'x-response-time',
    ];

    Object.keys(headers).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (safeHeaders.includes(lowerKey)) {
        sanitized[key] = String(headers[key]);
      }
    });

    return sanitized;
  }

  async getServiceHealth(): Promise<Record<string, any>> {
    const services = this.serviceRegistry.getAllServiceStatus();
    const health: Record<string, any> = {};

    services.forEach(service => {
      health[service.name] = {
        status: service.status,
        url: service.url,
        lastCheck: service.lastCheck,
        responseTime: service.responseTime,
        error: service.error,
      };
    });

    return health;
  }

  async warmupServices(): Promise<void> {
    this.logger.log('Warming up services...');

    const services = this.serviceRegistry.getAllServices();
    const warmupPromises = services.map(async (service) => {
      try {
        await this.proxyGet(service.name, service.healthEndpoint);
        this.logger.debug(`Warmed up ${service.name}`);
      } catch (error) {
        this.logger.warn(`Failed to warm up ${service.name}: ${error.message}`);
      }
    });

    await Promise.allSettled(warmupPromises);
    this.logger.log('Service warmup completed');
  }
}
