import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 8080);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

  // Compression middleware
  app.use(compression());

  // Body parsing middleware with larger limits for file uploads
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // CORS configuration
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Session-ID',
      'X-Request-ID',
      'X-User-ID',
      'X-Forwarded-For',
      'X-Forwarded-Proto',
      'X-Forwarded-Host',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false, // Allow extra properties for proxy
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Swagger documentation
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('E-commerce API Gateway')
      .setDescription('Unified API Gateway for E-commerce Microservices Platform')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Gateway', 'API Gateway endpoints')
      .addTag('Admin', 'Administrative endpoints')
      .addTag('Auth', 'Authentication endpoints (proxied)')
      .addTag('Users', 'User management endpoints (proxied)')
      .addTag('Products', 'Product catalog endpoints (proxied)')
      .addTag('Orders', 'Order management endpoints (proxied)')
      .addTag('Payments', 'Payment processing endpoints (proxied)')
      .addTag('Cart', 'Shopping cart endpoints (proxied)')
      .addTag('Inventory', 'Inventory management endpoints (proxied)')
      .addTag('Notifications', 'Notification endpoints (proxied)')
      .addServer(`http://localhost:${port}`, 'Development server')
      .addServer(`https://api.ecommerce.com`, 'Production server')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
    });

    logger.log(`Swagger documentation available at http://localhost:${port}/api/docs`);
  }

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      version: '1.0.0',
      environment: nodeEnv,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid,
    });
  });

  // Root endpoint
  app.getHttpAdapter().get('/', (req, res) => {
    res.json({
      message: 'E-commerce API Gateway',
      version: '1.0.0',
      documentation: '/api/docs',
      health: '/health',
      admin: '/api/v1/admin',
      services: [
        'auth-service',
        'user-service',
        'product-service',
        'order-service',
        'payment-service',
        'cart-service',
        'inventory-service',
        'notification-service',
      ],
    });
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.log(`${signal} received, shutting down gracefully`);
    
    try {
      await app.close();
      logger.log('Application closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Unhandled promise rejection
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // Uncaught exception
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  // Start server
  await app.listen(port, '0.0.0.0');
  
  logger.log(`🚀 API Gateway is running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`🏥 Health Check: http://localhost:${port}/health`);
  logger.log(`⚙️ Admin Panel: http://localhost:${port}/api/v1/admin`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`🔗 Proxying to microservices...`);
}

bootstrap().catch((error) => {
  Logger.error('Failed to start API Gateway', error);
  process.exit(1);
});
