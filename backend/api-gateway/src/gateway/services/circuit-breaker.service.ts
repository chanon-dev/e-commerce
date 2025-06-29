import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  monitoringPeriod: number;
}

export interface CircuitBreakerStatus {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuitBreakers: Map<string, CircuitBreakerStatus> = new Map();
  private readonly config: CircuitBreakerConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      failureThreshold: this.configService.get<number>('CIRCUIT_BREAKER_FAILURE_THRESHOLD', 5),
      successThreshold: this.configService.get<number>('CIRCUIT_BREAKER_SUCCESS_THRESHOLD', 3),
      timeout: this.configService.get<number>('CIRCUIT_BREAKER_TIMEOUT', 60000), // 1 minute
      monitoringPeriod: this.configService.get<number>('CIRCUIT_BREAKER_MONITORING_PERIOD', 300000), // 5 minutes
    };
  }

  async canExecute(serviceName: string): Promise<boolean> {
    const breaker = this.getOrCreateCircuitBreaker(serviceName);

    switch (breaker.state) {
      case CircuitBreakerState.CLOSED:
        return true;

      case CircuitBreakerState.OPEN:
        if (this.shouldAttemptReset(breaker)) {
          this.transitionToHalfOpen(serviceName, breaker);
          return true;
        }
        return false;

      case CircuitBreakerState.HALF_OPEN:
        return true;

      default:
        return false;
    }
  }

  recordSuccess(serviceName: string): void {
    const breaker = this.getOrCreateCircuitBreaker(serviceName);
    
    breaker.successCount++;
    breaker.totalSuccesses++;
    breaker.totalRequests++;

    switch (breaker.state) {
      case CircuitBreakerState.HALF_OPEN:
        if (breaker.successCount >= this.config.successThreshold) {
          this.transitionToClosed(serviceName, breaker);
        }
        break;

      case CircuitBreakerState.CLOSED:
        // Reset failure count on success
        breaker.failureCount = 0;
        break;
    }

    this.logger.debug(
      `Circuit breaker for ${serviceName}: Success recorded (${breaker.successCount}/${this.config.successThreshold})`,
    );
  }

  recordFailure(serviceName: string): void {
    const breaker = this.getOrCreateCircuitBreaker(serviceName);
    
    breaker.failureCount++;
    breaker.totalFailures++;
    breaker.totalRequests++;
    breaker.lastFailureTime = new Date();

    switch (breaker.state) {
      case CircuitBreakerState.CLOSED:
        if (breaker.failureCount >= this.config.failureThreshold) {
          this.transitionToOpen(serviceName, breaker);
        }
        break;

      case CircuitBreakerState.HALF_OPEN:
        this.transitionToOpen(serviceName, breaker);
        break;
    }

    this.logger.debug(
      `Circuit breaker for ${serviceName}: Failure recorded (${breaker.failureCount}/${this.config.failureThreshold})`,
    );
  }

  getCircuitBreakerStatus(serviceName: string): CircuitBreakerStatus {
    return this.getOrCreateCircuitBreaker(serviceName);
  }

  getAllCircuitBreakerStatus(): Record<string, CircuitBreakerStatus> {
    const status: Record<string, CircuitBreakerStatus> = {};
    
    this.circuitBreakers.forEach((breaker, serviceName) => {
      status[serviceName] = { ...breaker };
    });

    return status;
  }

  resetCircuitBreaker(serviceName: string): void {
    const breaker = this.getOrCreateCircuitBreaker(serviceName);
    
    breaker.state = CircuitBreakerState.CLOSED;
    breaker.failureCount = 0;
    breaker.successCount = 0;
    breaker.lastFailureTime = undefined;
    breaker.nextAttemptTime = undefined;

    this.logger.log(`Circuit breaker for ${serviceName} has been manually reset`);
  }

  private getOrCreateCircuitBreaker(serviceName: string): CircuitBreakerStatus {
    if (!this.circuitBreakers.has(serviceName)) {
      this.circuitBreakers.set(serviceName, {
        state: CircuitBreakerState.CLOSED,
        failureCount: 0,
        successCount: 0,
        totalRequests: 0,
        totalFailures: 0,
        totalSuccesses: 0,
      });
    }

    return this.circuitBreakers.get(serviceName)!;
  }

  private shouldAttemptReset(breaker: CircuitBreakerStatus): boolean {
    if (!breaker.nextAttemptTime) {
      return true;
    }

    return new Date() >= breaker.nextAttemptTime;
  }

  private transitionToClosed(serviceName: string, breaker: CircuitBreakerStatus): void {
    breaker.state = CircuitBreakerState.CLOSED;
    breaker.failureCount = 0;
    breaker.successCount = 0;
    breaker.nextAttemptTime = undefined;

    this.logger.log(`Circuit breaker for ${serviceName} transitioned to CLOSED`);
  }

  private transitionToOpen(serviceName: string, breaker: CircuitBreakerStatus): void {
    breaker.state = CircuitBreakerState.OPEN;
    breaker.successCount = 0;
    breaker.nextAttemptTime = new Date(Date.now() + this.config.timeout);

    this.logger.warn(
      `Circuit breaker for ${serviceName} transitioned to OPEN (next attempt at ${breaker.nextAttemptTime})`,
    );
  }

  private transitionToHalfOpen(serviceName: string, breaker: CircuitBreakerStatus): void {
    breaker.state = CircuitBreakerState.HALF_OPEN;
    breaker.successCount = 0;
    breaker.failureCount = 0;

    this.logger.log(`Circuit breaker for ${serviceName} transitioned to HALF_OPEN`);
  }

  getHealthMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};

    this.circuitBreakers.forEach((breaker, serviceName) => {
      const successRate = breaker.totalRequests > 0 
        ? (breaker.totalSuccesses / breaker.totalRequests) * 100 
        : 0;

      metrics[serviceName] = {
        state: breaker.state,
        successRate: Math.round(successRate * 100) / 100,
        totalRequests: breaker.totalRequests,
        totalFailures: breaker.totalFailures,
        totalSuccesses: breaker.totalSuccesses,
        currentFailureCount: breaker.failureCount,
        currentSuccessCount: breaker.successCount,
        lastFailureTime: breaker.lastFailureTime,
        nextAttemptTime: breaker.nextAttemptTime,
        isHealthy: breaker.state === CircuitBreakerState.CLOSED,
      };
    });

    return metrics;
  }

  // Periodic cleanup of old circuit breaker data
  cleanup(): void {
    const now = new Date();
    const cleanupThreshold = new Date(now.getTime() - this.config.monitoringPeriod);

    this.circuitBreakers.forEach((breaker, serviceName) => {
      // Reset counters if no recent activity
      if (breaker.lastFailureTime && breaker.lastFailureTime < cleanupThreshold) {
        if (breaker.state === CircuitBreakerState.CLOSED) {
          breaker.failureCount = 0;
          breaker.successCount = 0;
        }
      }
    });
  }
}
