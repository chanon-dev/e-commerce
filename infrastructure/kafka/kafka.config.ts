import { KafkaConfig, ProducerConfig, ConsumerConfig } from 'kafkajs';

export interface KafkaConfiguration {
  kafka: KafkaConfig;
  producer: ProducerConfig;
  consumer: ConsumerConfig;
  topics: {
    [key: string]: {
      topic: string;
      numPartitions: number;
      replicationFactor: number;
      configEntries?: Array<{
        name: string;
        value: string;
      }>;
    };
  };
}

export const kafkaConfig: KafkaConfiguration = {
  kafka: {
    clientId: 'ecommerce-platform',
    brokers: [
      process.env.KAFKA_BROKER_1 || 'localhost:9092',
      process.env.KAFKA_BROKER_2 || 'localhost:9093',
      process.env.KAFKA_BROKER_3 || 'localhost:9094',
    ],
    ssl: process.env.KAFKA_SSL_ENABLED === 'true' ? {
      rejectUnauthorized: false,
      ca: [process.env.KAFKA_SSL_CA || ''],
      key: process.env.KAFKA_SSL_KEY || '',
      cert: process.env.KAFKA_SSL_CERT || '',
    } : false,
    sasl: process.env.KAFKA_SASL_ENABLED === 'true' ? {
      mechanism: 'plain',
      username: process.env.KAFKA_SASL_USERNAME || '',
      password: process.env.KAFKA_SASL_PASSWORD || '',
    } : undefined,
    connectionTimeout: parseInt(process.env.KAFKA_CONNECTION_TIMEOUT || '3000'),
    authenticationTimeout: parseInt(process.env.KAFKA_AUTH_TIMEOUT || '1000'),
    reauthenticationThreshold: parseInt(process.env.KAFKA_REAUTH_THRESHOLD || '10000'),
    requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT || '30000'),
    enforceRequestTimeout: process.env.KAFKA_ENFORCE_REQUEST_TIMEOUT === 'true',
    retry: {
      initialRetryTime: parseInt(process.env.KAFKA_INITIAL_RETRY_TIME || '100'),
      retries: parseInt(process.env.KAFKA_RETRIES || '8'),
      maxRetryTime: parseInt(process.env.KAFKA_MAX_RETRY_TIME || '30000'),
      factor: parseFloat(process.env.KAFKA_RETRY_FACTOR || '0.2'),
      multiplier: parseFloat(process.env.KAFKA_RETRY_MULTIPLIER || '2'),
      restartOnFailure: async (e) => {
        console.error('Kafka connection failed, restarting...', e);
        return true;
      },
    },
    logLevel: parseInt(process.env.KAFKA_LOG_LEVEL || '2'), // INFO level
  },
  
  producer: {
    maxInFlightRequests: parseInt(process.env.KAFKA_PRODUCER_MAX_IN_FLIGHT || '1'),
    idempotent: process.env.KAFKA_PRODUCER_IDEMPOTENT !== 'false',
    transactionTimeout: parseInt(process.env.KAFKA_PRODUCER_TRANSACTION_TIMEOUT || '30000'),
    retry: {
      initialRetryTime: parseInt(process.env.KAFKA_PRODUCER_INITIAL_RETRY_TIME || '100'),
      retries: parseInt(process.env.KAFKA_PRODUCER_RETRIES || '5'),
      maxRetryTime: parseInt(process.env.KAFKA_PRODUCER_MAX_RETRY_TIME || '30000'),
    },
    metadataMaxAge: parseInt(process.env.KAFKA_PRODUCER_METADATA_MAX_AGE || '300000'),
    allowAutoTopicCreation: process.env.KAFKA_PRODUCER_AUTO_TOPIC_CREATION === 'true',
    compression: (process.env.KAFKA_PRODUCER_COMPRESSION as any) || 'gzip',
  },
  
  consumer: {
    groupId: process.env.KAFKA_CONSUMER_GROUP_ID || 'ecommerce-consumers',
    sessionTimeout: parseInt(process.env.KAFKA_CONSUMER_SESSION_TIMEOUT || '30000'),
    rebalanceTimeout: parseInt(process.env.KAFKA_CONSUMER_REBALANCE_TIMEOUT || '60000'),
    heartbeatInterval: parseInt(process.env.KAFKA_CONSUMER_HEARTBEAT_INTERVAL || '3000'),
    metadataMaxAge: parseInt(process.env.KAFKA_CONSUMER_METADATA_MAX_AGE || '300000'),
    allowAutoTopicCreation: process.env.KAFKA_CONSUMER_AUTO_TOPIC_CREATION === 'true',
    maxBytesPerPartition: parseInt(process.env.KAFKA_CONSUMER_MAX_BYTES_PER_PARTITION || '1048576'),
    minBytes: parseInt(process.env.KAFKA_CONSUMER_MIN_BYTES || '1'),
    maxBytes: parseInt(process.env.KAFKA_CONSUMER_MAX_BYTES || '10485760'),
    maxWaitTimeInMs: parseInt(process.env.KAFKA_CONSUMER_MAX_WAIT_TIME || '5000'),
    retry: {
      initialRetryTime: parseInt(process.env.KAFKA_CONSUMER_INITIAL_RETRY_TIME || '100'),
      retries: parseInt(process.env.KAFKA_CONSUMER_RETRIES || '8'),
      maxRetryTime: parseInt(process.env.KAFKA_CONSUMER_MAX_RETRY_TIME || '30000'),
      restartOnFailure: async (e) => {
        console.error('Kafka consumer failed, restarting...', e);
        return true;
      },
    },
  },
  
  topics: {
    userEvents: {
      topic: 'user-events',
      numPartitions: parseInt(process.env.KAFKA_USER_EVENTS_PARTITIONS || '3'),
      replicationFactor: parseInt(process.env.KAFKA_USER_EVENTS_REPLICATION || '2'),
      configEntries: [
        { name: 'retention.ms', value: process.env.KAFKA_USER_EVENTS_RETENTION || '604800000' }, // 7 days
        { name: 'cleanup.policy', value: 'delete' },
        { name: 'compression.type', value: 'gzip' },
        { name: 'max.message.bytes', value: '1000000' },
      ],
    },
    
    orderEvents: {
      topic: 'order-events',
      numPartitions: parseInt(process.env.KAFKA_ORDER_EVENTS_PARTITIONS || '6'),
      replicationFactor: parseInt(process.env.KAFKA_ORDER_EVENTS_REPLICATION || '3'),
      configEntries: [
        { name: 'retention.ms', value: process.env.KAFKA_ORDER_EVENTS_RETENTION || '2592000000' }, // 30 days
        { name: 'cleanup.policy', value: 'delete' },
        { name: 'compression.type', value: 'gzip' },
        { name: 'max.message.bytes', value: '2000000' },
        { name: 'min.insync.replicas', value: '2' },
      ],
    },
    
    paymentEvents: {
      topic: 'payment-events',
      numPartitions: parseInt(process.env.KAFKA_PAYMENT_EVENTS_PARTITIONS || '6'),
      replicationFactor: parseInt(process.env.KAFKA_PAYMENT_EVENTS_REPLICATION || '3'),
      configEntries: [
        { name: 'retention.ms', value: process.env.KAFKA_PAYMENT_EVENTS_RETENTION || '7776000000' }, // 90 days
        { name: 'cleanup.policy', value: 'delete' },
        { name: 'compression.type', value: 'gzip' },
        { name: 'max.message.bytes', value: '1000000' },
        { name: 'min.insync.replicas', value: '2' },
      ],
    },
    
    inventoryEvents: {
      topic: 'inventory-events',
      numPartitions: parseInt(process.env.KAFKA_INVENTORY_EVENTS_PARTITIONS || '4'),
      replicationFactor: parseInt(process.env.KAFKA_INVENTORY_EVENTS_REPLICATION || '2'),
      configEntries: [
        { name: 'retention.ms', value: process.env.KAFKA_INVENTORY_EVENTS_RETENTION || '1209600000' }, // 14 days
        { name: 'cleanup.policy', value: 'delete' },
        { name: 'compression.type', value: 'gzip' },
        { name: 'max.message.bytes', value: '500000' },
      ],
    },
    
    productEvents: {
      topic: 'product-events',
      numPartitions: parseInt(process.env.KAFKA_PRODUCT_EVENTS_PARTITIONS || '3'),
      replicationFactor: parseInt(process.env.KAFKA_PRODUCT_EVENTS_REPLICATION || '2'),
      configEntries: [
        { name: 'retention.ms', value: process.env.KAFKA_PRODUCT_EVENTS_RETENTION || '2592000000' }, // 30 days
        { name: 'cleanup.policy', value: 'delete' },
        { name: 'compression.type', value: 'gzip' },
        { name: 'max.message.bytes', value: '2000000' },
      ],
    },
    
    cartEvents: {
      topic: 'cart-events',
      numPartitions: parseInt(process.env.KAFKA_CART_EVENTS_PARTITIONS || '4'),
      replicationFactor: parseInt(process.env.KAFKA_CART_EVENTS_REPLICATION || '2'),
      configEntries: [
        { name: 'retention.ms', value: process.env.KAFKA_CART_EVENTS_RETENTION || '259200000' }, // 3 days
        { name: 'cleanup.policy', value: 'delete' },
        { name: 'compression.type', value: 'gzip' },
        { name: 'max.message.bytes', value: '1000000' },
      ],
    },
    
    shippingEvents: {
      topic: 'shipping-events',
      numPartitions: parseInt(process.env.KAFKA_SHIPPING_EVENTS_PARTITIONS || '4'),
      replicationFactor: parseInt(process.env.KAFKA_SHIPPING_EVENTS_REPLICATION || '2'),
      configEntries: [
        { name: 'retention.ms', value: process.env.KAFKA_SHIPPING_EVENTS_RETENTION || '2592000000' }, // 30 days
        { name: 'cleanup.policy', value: 'delete' },
        { name: 'compression.type', value: 'gzip' },
        { name: 'max.message.bytes', value: '1000000' },
      ],
    },
    
    reviewEvents: {
      topic: 'review-events',
      numPartitions: parseInt(process.env.KAFKA_REVIEW_EVENTS_PARTITIONS || '3'),
      replicationFactor: parseInt(process.env.KAFKA_REVIEW_EVENTS_REPLICATION || '2'),
      configEntries: [
        { name: 'retention.ms', value: process.env.KAFKA_REVIEW_EVENTS_RETENTION || '7776000000' }, // 90 days
        { name: 'cleanup.policy', value: 'delete' },
        { name: 'compression.type', value: 'gzip' },
        { name: 'max.message.bytes', value: '2000000' },
      ],
    },
    
    promotionEvents: {
      topic: 'promotion-events',
      numPartitions: parseInt(process.env.KAFKA_PROMOTION_EVENTS_PARTITIONS || '2'),
      replicationFactor: parseInt(process.env.KAFKA_PROMOTION_EVENTS_REPLICATION || '2'),
      configEntries: [
        { name: 'retention.ms', value: process.env.KAFKA_PROMOTION_EVENTS_RETENTION || '2592000000' }, // 30 days
        { name: 'cleanup.policy', value: 'delete' },
        { name: 'compression.type', value: 'gzip' },
        { name: 'max.message.bytes', value: '500000' },
      ],
    },
    
    notificationEvents: {
      topic: 'notification-events',
      numPartitions: parseInt(process.env.KAFKA_NOTIFICATION_EVENTS_PARTITIONS || '4'),
      replicationFactor: parseInt(process.env.KAFKA_NOTIFICATION_EVENTS_REPLICATION || '2'),
      configEntries: [
        { name: 'retention.ms', value: process.env.KAFKA_NOTIFICATION_EVENTS_RETENTION || '604800000' }, // 7 days
        { name: 'cleanup.policy', value: 'delete' },
        { name: 'compression.type', value: 'gzip' },
        { name: 'max.message.bytes', value: '1000000' },
      ],
    },
    
    analyticsEvents: {
      topic: 'analytics-events',
      numPartitions: parseInt(process.env.KAFKA_ANALYTICS_EVENTS_PARTITIONS || '8'),
      replicationFactor: parseInt(process.env.KAFKA_ANALYTICS_EVENTS_REPLICATION || '2'),
      configEntries: [
        { name: 'retention.ms', value: process.env.KAFKA_ANALYTICS_EVENTS_RETENTION || '2592000000' }, // 30 days
        { name: 'cleanup.policy', value: 'delete' },
        { name: 'compression.type', value: 'gzip' },
        { name: 'max.message.bytes', value: '500000' },
      ],
    },
    
    auditEvents: {
      topic: 'audit-events',
      numPartitions: parseInt(process.env.KAFKA_AUDIT_EVENTS_PARTITIONS || '4'),
      replicationFactor: parseInt(process.env.KAFKA_AUDIT_EVENTS_REPLICATION || '3'),
      configEntries: [
        { name: 'retention.ms', value: process.env.KAFKA_AUDIT_EVENTS_RETENTION || '31536000000' }, // 365 days
        { name: 'cleanup.policy', value: 'delete' },
        { name: 'compression.type', value: 'gzip' },
        { name: 'max.message.bytes', value: '1000000' },
        { name: 'min.insync.replicas', value: '2' },
      ],
    },
  },
};

// Environment-specific configurations
export const getKafkaConfig = (environment: string = process.env.NODE_ENV || 'development'): KafkaConfiguration => {
  const baseConfig = { ...kafkaConfig };
  
  switch (environment) {
    case 'production':
      return {
        ...baseConfig,
        kafka: {
          ...baseConfig.kafka,
          ssl: {
            rejectUnauthorized: true,
            ca: [process.env.KAFKA_SSL_CA || ''],
            key: process.env.KAFKA_SSL_KEY || '',
            cert: process.env.KAFKA_SSL_CERT || '',
          },
          sasl: {
            mechanism: 'plain',
            username: process.env.KAFKA_SASL_USERNAME || '',
            password: process.env.KAFKA_SASL_PASSWORD || '',
          },
        },
        producer: {
          ...baseConfig.producer,
          idempotent: true,
          maxInFlightRequests: 1,
        },
      };
      
    case 'staging':
      return {
        ...baseConfig,
        kafka: {
          ...baseConfig.kafka,
          brokers: [
            process.env.KAFKA_STAGING_BROKER_1 || 'kafka-staging-1:9092',
            process.env.KAFKA_STAGING_BROKER_2 || 'kafka-staging-2:9092',
          ],
        },
      };
      
    case 'development':
    default:
      return {
        ...baseConfig,
        kafka: {
          ...baseConfig.kafka,
          brokers: ['localhost:9092'],
          ssl: false,
          sasl: undefined,
        },
      };
  }
};

// Topic creation utility
export const createTopicsConfig = () => {
  return Object.values(kafkaConfig.topics).map(topicConfig => ({
    topic: topicConfig.topic,
    numPartitions: topicConfig.numPartitions,
    replicationFactor: topicConfig.replicationFactor,
    configEntries: topicConfig.configEntries,
  }));
};
