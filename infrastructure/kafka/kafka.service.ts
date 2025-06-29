import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Producer, Consumer, Admin, KafkaMessage } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { getKafkaConfig, createTopicsConfig } from './kafka.config';
import { KafkaEvent, BaseEvent } from './schemas/events';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();
  private admin: Admin;
  private isConnected = false;

  constructor() {
    const config = getKafkaConfig();
    this.kafka = new Kafka(config.kafka);
    this.producer = this.kafka.producer(config.producer);
    this.admin = this.kafka.admin();
  }

  async onModuleInit() {
    try {
      await this.connect();
      await this.createTopics();
      this.logger.log('✅ Kafka service initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Kafka service:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      // Connect admin client
      await this.admin.connect();
      this.logger.log('📋 Kafka admin connected');

      // Connect producer
      await this.producer.connect();
      this.logger.log('📤 Kafka producer connected');

      this.isConnected = true;
    } catch (error) {
      this.logger.error('❌ Failed to connect to Kafka:', error);
      throw error;
    }
  }

  private async disconnect() {
    try {
      // Disconnect all consumers
      for (const [groupId, consumer] of this.consumers) {
        await consumer.disconnect();
        this.logger.log(`📥 Consumer ${groupId} disconnected`);
      }
      this.consumers.clear();

      // Disconnect producer
      if (this.producer) {
        await this.producer.disconnect();
        this.logger.log('📤 Kafka producer disconnected');
      }

      // Disconnect admin
      if (this.admin) {
        await this.admin.disconnect();
        this.logger.log('📋 Kafka admin disconnected');
      }

      this.isConnected = false;
    } catch (error) {
      this.logger.error('❌ Error disconnecting from Kafka:', error);
    }
  }

  private async createTopics() {
    try {
      const topicsConfig = createTopicsConfig();
      const existingTopics = await this.admin.listTopics();
      
      const topicsToCreate = topicsConfig.filter(
        topic => !existingTopics.includes(topic.topic)
      );

      if (topicsToCreate.length > 0) {
        await this.admin.createTopics({
          topics: topicsToCreate,
          waitForLeaders: true,
          timeout: 30000,
        });

        this.logger.log(`📝 Created ${topicsToCreate.length} Kafka topics:`, 
          topicsToCreate.map(t => t.topic).join(', ')
        );
      } else {
        this.logger.log('📝 All Kafka topics already exist');
      }
    } catch (error) {
      this.logger.error('❌ Failed to create Kafka topics:', error);
      throw error;
    }
  }

  // Producer methods
  async publishEvent<T extends KafkaEvent>(
    topic: string,
    event: T,
    options?: {
      key?: string;
      partition?: number;
      headers?: Record<string, string>;
    }
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka service is not connected');
    }

    try {
      // Ensure event has required base fields
      const enrichedEvent: T = {
        ...event,
        eventId: event.eventId || uuidv4(),
        timestamp: event.timestamp || new Date().toISOString(),
        version: event.version || '1.0',
        source: event.source || 'ecommerce-platform',
      };

      const message = {
        key: options?.key || enrichedEvent.eventId,
        value: JSON.stringify(enrichedEvent),
        partition: options?.partition,
        headers: {
          'content-type': 'application/json',
          'event-type': enrichedEvent.eventType,
          'event-version': enrichedEvent.version,
          'correlation-id': enrichedEvent.correlationId || '',
          ...options?.headers,
        },
        timestamp: Date.now().toString(),
      };

      await this.producer.send({
        topic,
        messages: [message],
      });

      this.logger.debug(`📤 Published event ${enrichedEvent.eventType} to topic ${topic}`);
    } catch (error) {
      this.logger.error(`❌ Failed to publish event to topic ${topic}:`, error);
      throw error;
    }
  }

  async publishBatch<T extends KafkaEvent>(
    topic: string,
    events: T[],
    options?: {
      keyExtractor?: (event: T) => string;
      partitionExtractor?: (event: T) => number;
      headers?: Record<string, string>;
    }
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka service is not connected');
    }

    try {
      const messages = events.map(event => {
        const enrichedEvent: T = {
          ...event,
          eventId: event.eventId || uuidv4(),
          timestamp: event.timestamp || new Date().toISOString(),
          version: event.version || '1.0',
          source: event.source || 'ecommerce-platform',
        };

        return {
          key: options?.keyExtractor?.(enrichedEvent) || enrichedEvent.eventId,
          value: JSON.stringify(enrichedEvent),
          partition: options?.partitionExtractor?.(enrichedEvent),
          headers: {
            'content-type': 'application/json',
            'event-type': enrichedEvent.eventType,
            'event-version': enrichedEvent.version,
            'correlation-id': enrichedEvent.correlationId || '',
            ...options?.headers,
          },
          timestamp: Date.now().toString(),
        };
      });

      await this.producer.send({
        topic,
        messages,
      });

      this.logger.debug(`📤 Published ${events.length} events to topic ${topic}`);
    } catch (error) {
      this.logger.error(`❌ Failed to publish batch to topic ${topic}:`, error);
      throw error;
    }
  }

  // Consumer methods
  async createConsumer(
    groupId: string,
    topics: string[],
    handler: (message: KafkaMessage, topic: string, partition: number) => Promise<void>,
    options?: {
      fromBeginning?: boolean;
      autoCommit?: boolean;
      sessionTimeout?: number;
      heartbeatInterval?: number;
    }
  ): Promise<Consumer> {
    try {
      const config = getKafkaConfig();
      const consumer = this.kafka.consumer({
        ...config.consumer,
        groupId,
        sessionTimeout: options?.sessionTimeout || config.consumer.sessionTimeout,
        heartbeatInterval: options?.heartbeatInterval || config.consumer.heartbeatInterval,
      });

      await consumer.connect();
      await consumer.subscribe({
        topics,
        fromBeginning: options?.fromBeginning || false,
      });

      await consumer.run({
        autoCommit: options?.autoCommit !== false,
        eachMessage: async ({ topic, partition, message }) => {
          try {
            this.logger.debug(`📥 Received message from topic ${topic}, partition ${partition}`);
            await handler(message, topic, partition);
          } catch (error) {
            this.logger.error(`❌ Error processing message from topic ${topic}:`, error);
            // Implement dead letter queue logic here if needed
            throw error;
          }
        },
      });

      this.consumers.set(groupId, consumer);
      this.logger.log(`📥 Consumer ${groupId} created for topics: ${topics.join(', ')}`);

      return consumer;
    } catch (error) {
      this.logger.error(`❌ Failed to create consumer ${groupId}:`, error);
      throw error;
    }
  }

  async stopConsumer(groupId: string): Promise<void> {
    const consumer = this.consumers.get(groupId);
    if (consumer) {
      await consumer.disconnect();
      this.consumers.delete(groupId);
      this.logger.log(`📥 Consumer ${groupId} stopped`);
    }
  }

  // Event parsing utility
  parseEvent<T extends KafkaEvent>(message: KafkaMessage): T | null {
    try {
      if (!message.value) {
        return null;
      }

      const eventData = JSON.parse(message.value.toString());
      
      // Validate event structure
      if (!eventData.eventId || !eventData.eventType || !eventData.timestamp) {
        this.logger.warn('⚠️ Invalid event structure:', eventData);
        return null;
      }

      return eventData as T;
    } catch (error) {
      this.logger.error('❌ Failed to parse event:', error);
      return null;
    }
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    producer: boolean;
    consumers: number;
    topics: string[];
  }> {
    try {
      const topics = await this.admin.listTopics();
      
      return {
        status: this.isConnected ? 'healthy' : 'unhealthy',
        producer: this.isConnected,
        consumers: this.consumers.size,
        topics,
      };
    } catch (error) {
      this.logger.error('❌ Kafka health check failed:', error);
      return {
        status: 'unhealthy',
        producer: false,
        consumers: 0,
        topics: [],
      };
    }
  }

  // Admin operations
  async getTopicMetadata(topics?: string[]) {
    try {
      return await this.admin.fetchTopicMetadata({ topics });
    } catch (error) {
      this.logger.error('❌ Failed to fetch topic metadata:', error);
      throw error;
    }
  }

  async getConsumerGroups() {
    try {
      return await this.admin.listGroups();
    } catch (error) {
      this.logger.error('❌ Failed to list consumer groups:', error);
      throw error;
    }
  }

  async resetConsumerGroup(groupId: string, topics?: string[]) {
    try {
      await this.admin.resetOffsets({
        groupId,
        topic: topics?.[0] || '', // Reset specific topic or all
        earliest: true,
      });
      this.logger.log(`🔄 Reset consumer group ${groupId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to reset consumer group ${groupId}:`, error);
      throw error;
    }
  }

  // Utility methods
  isHealthy(): boolean {
    return this.isConnected;
  }

  getActiveConsumers(): string[] {
    return Array.from(this.consumers.keys());
  }
}
