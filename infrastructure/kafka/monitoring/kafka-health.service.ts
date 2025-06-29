import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KafkaService } from '../kafka.service';
import { EventPublisherService } from '../event-publisher.service';

export interface KafkaHealthMetrics {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  producer: {
    status: 'connected' | 'disconnected';
    messagesProduced: number;
    errors: number;
    avgLatency: number;
  };
  consumers: {
    active: number;
    total: number;
    lag: number;
    errors: number;
  };
  topics: {
    total: number;
    healthy: number;
    partitions: number;
  };
  brokers: {
    available: number;
    total: number;
  };
  errors: string[];
  warnings: string[];
}

@Injectable()
export class KafkaHealthService {
  private readonly logger = new Logger(KafkaHealthService.name);
  private metrics: KafkaHealthMetrics = this.initializeMetrics();
  private messageCount = 0;
  private errorCount = 0;
  private latencySum = 0;
  private latencyCount = 0;

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  private initializeMetrics(): KafkaHealthMetrics {
    return {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      producer: {
        status: 'connected',
        messagesProduced: 0,
        errors: 0,
        avgLatency: 0,
      },
      consumers: {
        active: 0,
        total: 0,
        lag: 0,
        errors: 0,
      },
      topics: {
        total: 0,
        healthy: 0,
        partitions: 0,
      },
      brokers: {
        available: 0,
        total: 0,
      },
      errors: [],
      warnings: [],
    };
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async performHealthCheck(): Promise<void> {
    try {
      await this.updateMetrics();
      await this.checkThresholds();
      
      if (this.metrics.status !== 'healthy') {
        this.logger.warn(`⚠️ Kafka health status: ${this.metrics.status}`);
        await this.sendHealthAlert();
      }
    } catch (error) {
      this.logger.error('❌ Health check failed:', error);
      this.metrics.status = 'unhealthy';
      this.metrics.errors.push(`Health check failed: ${error.message}`);
    }
  }

  private async updateMetrics(): Promise<void> {
    const timestamp = new Date().toISOString();
    
    try {
      // Get basic health info
      const healthInfo = await this.kafkaService.healthCheck();
      
      // Update producer metrics
      this.metrics.producer.status = healthInfo.producer ? 'connected' : 'disconnected';
      this.metrics.producer.messagesProduced = this.messageCount;
      this.metrics.producer.errors = this.errorCount;
      this.metrics.producer.avgLatency = this.latencyCount > 0 ? this.latencySum / this.latencyCount : 0;
      
      // Update consumer metrics
      this.metrics.consumers.active = healthInfo.consumers;
      this.metrics.consumers.total = healthInfo.consumers;
      
      // Update topic metrics
      this.metrics.topics.total = healthInfo.topics.length;
      this.metrics.topics.healthy = healthInfo.topics.length; // Simplified
      
      // Get detailed topic metadata
      try {
        const topicMetadata = await this.kafkaService.getTopicMetadata();
        let totalPartitions = 0;
        
        for (const topic of topicMetadata.topics) {
          totalPartitions += topic.partitions.length;
        }
        
        this.metrics.topics.partitions = totalPartitions;
      } catch (error) {
        this.metrics.warnings.push(`Failed to get topic metadata: ${error.message}`);
      }
      
      // Get consumer group info
      try {
        const consumerGroups = await this.kafkaService.getConsumerGroups();
        // Update consumer lag and error metrics based on consumer groups
        // This would require more detailed implementation
      } catch (error) {
        this.metrics.warnings.push(`Failed to get consumer groups: ${error.message}`);
      }
      
      this.metrics.timestamp = timestamp;
      
    } catch (error) {
      this.metrics.errors.push(`Metrics update failed: ${error.message}`);
      throw error;
    }
  }

  private async checkThresholds(): Promise<void> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check producer health
    if (this.metrics.producer.status !== 'connected') {
      errors.push('Producer is disconnected');
    }
    
    if (this.metrics.producer.errors > 10) {
      errors.push(`High producer error rate: ${this.metrics.producer.errors}`);
    }
    
    if (this.metrics.producer.avgLatency > 5000) {
      warnings.push(`High producer latency: ${this.metrics.producer.avgLatency}ms`);
    }
    
    // Check consumer health
    if (this.metrics.consumers.active === 0) {
      errors.push('No active consumers');
    }
    
    if (this.metrics.consumers.lag > 1000) {
      warnings.push(`High consumer lag: ${this.metrics.consumers.lag}`);
    }
    
    if (this.metrics.consumers.errors > 5) {
      warnings.push(`Consumer errors detected: ${this.metrics.consumers.errors}`);
    }
    
    // Check topic health
    if (this.metrics.topics.healthy < this.metrics.topics.total) {
      warnings.push(`Some topics are unhealthy: ${this.metrics.topics.healthy}/${this.metrics.topics.total}`);
    }
    
    // Determine overall status
    if (errors.length > 0) {
      this.metrics.status = 'unhealthy';
    } else if (warnings.length > 0) {
      this.metrics.status = 'degraded';
    } else {
      this.metrics.status = 'healthy';
    }
    
    this.metrics.errors = errors;
    this.metrics.warnings = warnings;
  }

  private async sendHealthAlert(): Promise<void> {
    try {
      // Send health alert notification
      // This could be integrated with your notification system
      
      const alertData = {
        service: 'kafka',
        status: this.metrics.status,
        errors: this.metrics.errors,
        warnings: this.metrics.warnings,
        timestamp: this.metrics.timestamp,
      };
      
      this.logger.warn('🚨 Kafka health alert:', alertData);
      
      // You could publish this as an event or send to monitoring system
      // await this.eventPublisher.publishHealthAlert(alertData);
      
    } catch (error) {
      this.logger.error('❌ Failed to send health alert:', error);
    }
  }

  // Methods to track metrics from other services
  recordMessageProduced(latency: number): void {
    this.messageCount++;
    this.latencySum += latency;
    this.latencyCount++;
  }

  recordProducerError(): void {
    this.errorCount++;
  }

  recordConsumerError(): void {
    this.metrics.consumers.errors++;
  }

  // Public methods to get health information
  getHealthMetrics(): KafkaHealthMetrics {
    return { ...this.metrics };
  }

  getHealthStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    return this.metrics.status;
  }

  isHealthy(): boolean {
    return this.metrics.status === 'healthy';
  }

  getProducerMetrics() {
    return {
      messagesProduced: this.messageCount,
      errors: this.errorCount,
      avgLatency: this.latencyCount > 0 ? this.latencySum / this.latencyCount : 0,
    };
  }

  getConsumerMetrics() {
    return {
      active: this.metrics.consumers.active,
      lag: this.metrics.consumers.lag,
      errors: this.metrics.consumers.errors,
    };
  }

  // Reset metrics (useful for testing or periodic resets)
  resetMetrics(): void {
    this.messageCount = 0;
    this.errorCount = 0;
    this.latencySum = 0;
    this.latencyCount = 0;
    this.metrics.consumers.errors = 0;
    this.metrics.errors = [];
    this.metrics.warnings = [];
  }

  // Manual health check trigger
  async triggerHealthCheck(): Promise<KafkaHealthMetrics> {
    await this.performHealthCheck();
    return this.getHealthMetrics();
  }

  // Get detailed health report
  async getDetailedHealthReport(): Promise<{
    summary: KafkaHealthMetrics;
    topicDetails: any[];
    consumerGroupDetails: any[];
  }> {
    try {
      const topicMetadata = await this.kafkaService.getTopicMetadata();
      const consumerGroups = await this.kafkaService.getConsumerGroups();
      
      return {
        summary: this.getHealthMetrics(),
        topicDetails: topicMetadata.topics,
        consumerGroupDetails: consumerGroups.groups,
      };
    } catch (error) {
      this.logger.error('❌ Failed to get detailed health report:', error);
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldMetrics(): Promise<void> {
    // Reset counters periodically to prevent overflow
    if (this.messageCount > 1000000) {
      this.resetMetrics();
      this.logger.log('🧹 Kafka metrics reset due to high counter values');
    }
  }
}
