import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // ── Trust first proxy for correct IP detection
  // Required for production deployments behind reverse proxies (Render, Cloudflare, Nginx)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // ── Security headers
  app.use(helmet());

  // ── CORS — allow localhost + all production domains
  const frontendUrl = config.get<string>('FRONTEND_URL', 'http://localhost:4200');
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'https://skf-fitness.netlify.app',
      frontendUrl,
    ].filter((v, i, a) => a.indexOf(v) === i), // deduplicate
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ── Global validation — strip unknown fields, reject bad input
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strip properties not in DTO
      forbidNonWhitelisted: true,// throw on extra properties
      transform: true,           // auto-transform types (string -> number etc.)
    }),
  );

  // ── Global prefix
  app.setGlobalPrefix('api');

  // ── Swagger API Documentation
  if (config.get<string>('NODE_ENV') !== 'production' || config.get<boolean>('SWAGGER_ENABLED')) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SKF Fitness API')
      .setDescription('REST API for SKF Fitness gym management system')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('members', 'Member management')
      .addTag('membership', 'Membership plans and activation')
      .addTag('profile', 'Member profiles and progress tracking')
      .addTag('bookings', 'Class and trainer booking')
      .addTag('payments', 'Razorpay payment integration')
      .addTag('contact', 'Contact form submissions')
      .addTag('admin', 'Admin operations')
      .addTag('health', 'Health check endpoint')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
    console.log('Swagger API documentation available at /api/docs');
  }

  const port = config.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`SKF Fitness Backend running on port ${port} [${process.env.NODE_ENV ?? 'development'}]`);
}
bootstrap();
