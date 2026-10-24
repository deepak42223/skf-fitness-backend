import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // POST /api/auth/login
  // Rate limit: 5 attempts per 15 minutes to prevent brute force
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or inactive account' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @Post('login')
  login(@Body() dto: LoginDto): Promise<object> {
    return this.authService.login(dto);
  }

  // POST /api/auth/send-otp
  // Rate limit: 3 attempts per 10 minutes
  @ApiOperation({ summary: 'Send OTP to email for verification' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Email already registered' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  @Throttle({ default: { limit: 3, ttl: 600000 } })
  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto): Promise<object> {
    return this.authService.sendOtp(dto);
  }

  // POST /api/auth/verify-otp
  // Rate limit: 5 attempts per 10 minutes
  @ApiOperation({ summary: 'Verify OTP sent to email' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  @Throttle({ default: { limit: 5, ttl: 600000 } })
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto): Promise<object> {
    return this.authService.verifyOtp(dto);
  }

  // POST /api/auth/resend-otp
  // Rate limit: 2 attempts per 10 minutes
  @ApiOperation({ summary: 'Resend OTP to email' })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  @Throttle({ default: { limit: 2, ttl: 600000 } })
  @Post('resend-otp')
  resendOtp(@Body('email') email: string): Promise<object> {
    return this.authService.resendOtp(email);
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
