import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // POST /api/auth/login
  // Rate limit: 5 attempts per minute to prevent brute force
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or inactive account' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  login(@Body() dto: LoginDto): Promise<object> {
    return this.authService.login(dto);
  }

  // POST /api/auth/forgot-password
  // Rate limit: 3 attempts per hour to prevent abuse
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({ status: 200, description: 'Reset email sent if account exists' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<object> {
    return this.authService.forgotPassword(dto);
  }

  // POST /api/auth/reset-password
  // Rate limit: 3 attempts per hour
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto): Promise<object> {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
