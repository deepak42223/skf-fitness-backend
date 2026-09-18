import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // ── Security headers
  app.use(helmet());

  // ── CORS — exact origins only, no wildcard subdomains
  const frontendUrl = config.get<string>('FRONTEND_URL', 'http://localhost:4200');
  app.enableCors({
    origin: [
      'http://localhost:4200',
      frontendUrl,
    ],
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

  const port = config.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`SKF Fitness Backend running on port ${port} [${process.env.NODE_ENV ?? 'development'}]`);
}
bootstrap();
