import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // POST /api/auth/login
  @Post('login')
  login(@Body() dto: LoginDto): Promise<object> {
    return this.authService.login(dto);
  }

  // POST /api/auth/forgot-password
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<object> {
    return this.authService.forgotPassword(dto);
  }

  // POST /api/auth/reset-password
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto): Promise<object> {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
