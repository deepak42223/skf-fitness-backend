import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for Angular frontend
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'https://skf-fitness.netlify.app',  // replace with your Netlify URL
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // API prefix
  app.setGlobalPrefix('api');

  await app.listen(3000);
  console.log('SKF Fitness Backend running on http://localhost:3000/api');
}
bootstrap();
