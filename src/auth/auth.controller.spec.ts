import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { INestApplication, ValidationPipe, Controller, Post, Body } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request = require('supertest');
import { CustomThrottlerGuard } from './guards/custom-throttler.guard';
import { Throttle } from '@nestjs/throttler';

// Simple test controller to avoid AuthService dependencies
@Controller('test-auth')
class TestAuthController {
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @Post('login')
  login(@Body() body: any) {
    return { message: 'Login processed', email: body.email };
  }

  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('forgot-password')
  forgotPassword(@Body() body: any) {
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('reset-password')
  resetPassword(@Body() body: any) {
    return { message: 'Password reset successful' };
  }
}

describe('AuthController Rate Limiting', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        // Configure ThrottlerModule with short TTL for testing
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
      ],
      controllers: [TestAuthController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: CustomThrottlerGuard,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/test-auth/login rate limiting', () => {
    it('should allow 5 login attempts for the same email', async () => {
      const email = `test-login-${Date.now()}@example.com`;
      
      for (let i = 0; i < 5; i++) {
        const response = await request(app.getHttpServer())
          .post('/api/test-auth/login')
          .send({ email, password: 'wrongpass123' });
        
        // Should get 200 or 201, NOT 429 (rate limit)
        expect(response.status).not.toBe(429);
      }
    });

    it('should block 6th login attempt with 429 for the same email', async () => {
      const email = `test-login-block-${Date.now()}@example.com`;
      
      // Make 5 requests first
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/test-auth/login')
          .send({ email, password: 'wrongpass123' });
      }

      // 6th request should be rate limited
      const response = await request(app.getHttpServer())
        .post('/api/test-auth/login')
        .send({ email, password: 'wrongpass123' });

      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('too many');
    });

    it('should track rate limits per email, not per IP', async () => {
      const email1 = `test-email1-${Date.now()}@example.com`;
      const email2 = `test-email2-${Date.now()}@example.com`;
      
      // Exhaust limit for email1
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/test-auth/login')
          .send({ email: email1, password: 'wrongpass123' });
      }

      // email1 should be blocked
      const blocked = await request(app.getHttpServer())
        .post('/api/test-auth/login')
        .send({ email: email1, password: 'wrongpass123' });
      expect(blocked.status).toBe(429);

      // email2 should still work (different tracking key)
      const allowed = await request(app.getHttpServer())
        .post('/api/test-auth/login')
        .send({ email: email2, password: 'wrongpass123' });
      expect(allowed.status).not.toBe(429);
    });
  });

  describe('POST /api/test-auth/forgot-password rate limiting', () => {
    it('should allow 3 forgot-password requests for the same email', async () => {
      const email = `test-forgot-${Date.now()}@example.com`;
      
      for (let i = 0; i < 3; i++) {
        const response = await request(app.getHttpServer())
          .post('/api/test-auth/forgot-password')
          .send({ email });
        
        // Should get 200 or 201, NOT 429
        expect(response.status).not.toBe(429);
      }
    });

    it('should block 4th forgot-password request with 429', async () => {
      const email = `test-forgot-block-${Date.now()}@example.com`;
      
      // Make 3 requests first
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/api/test-auth/forgot-password')
          .send({ email });
      }

      // 4th request should be rate limited
      const response = await request(app.getHttpServer())
        .post('/api/test-auth/forgot-password')
        .send({ email });

      expect(response.status).toBe(429);
      expect(response.body.message.toLowerCase()).toContain('too many');
    });
  });

  describe('POST /api/test-auth/reset-password rate limiting', () => {
    it('should allow 3 reset-password requests with the same token', async () => {
      const token = `test-token-${Date.now()}`;
      
      for (let i = 0; i < 3; i++) {
        const response = await request(app.getHttpServer())
          .post('/api/test-auth/reset-password')
          .send({ token, newPassword: 'NewPassword123!' });
        
        // Should get 200 or 201, NOT 429
        expect(response.status).not.toBe(429);
      }
    });

    it('should block 4th reset-password request with 429', async () => {
      const token = `test-token-block-${Date.now()}`;
      
      // Make 3 requests first
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/api/test-auth/reset-password')
          .send({ token, newPassword: 'NewPassword123!' });
      }

      // 4th request should be rate limited
      const response = await request(app.getHttpServer())
        .post('/api/test-auth/reset-password')
        .send({ token, newPassword: 'NewPassword123!' });

      expect(response.status).toBe(429);
      expect(response.body.message.toLowerCase()).toContain('too many');
    });
  });

  describe('Rate limit response structure', () => {
    it('should return proper 429 error structure', async () => {
      const email = `test-structure-${Date.now()}@example.com`;
      
      // Exhaust rate limit
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/test-auth/login')
          .send({ email, password: 'test123' });
      }

      // Get 429 response
      const response = await request(app.getHttpServer())
        .post('/api/test-auth/login')
        .send({ email, password: 'test123' });

      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('statusCode', 429);
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });
  });
});
