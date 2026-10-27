import {
  Injectable, UnauthorizedException, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { MembersService } from '../members/members.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetTokenEntity } from './entities/reset-token.entity';
import { EmailOtpEntity } from './entities/email-otp.entity';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { NotificationsService } from '../notifications/notifications.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private membersService: MembersService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
    @InjectRepository(ResetTokenEntity)
    private resetTokenRepo: Repository<ResetTokenEntity>,
    @InjectRepository(EmailOtpEntity)
    private otpRepo: Repository<EmailOtpEntity>,
  ) {}

  async login(dto: LoginDto): Promise<object> {
    const member = await this.membersService.findByEmail(dto.email);
    if (!member) throw new UnauthorizedException('Invalid email or password');

    const isValid = await bcrypt.compare(dto.password, member.password);
    if (!isValid) throw new UnauthorizedException('Invalid email or password');

    if (!member.isActive) {
      throw new UnauthorizedException('Account is deactivated. Contact support.');
    }

    const payload = { sub: member.id, email: member.email, role: member.role ?? 'member' };
    const token = this.jwtService.sign(payload);

    const { password, ...result } = member;
    return {
      message: 'Login successful',
      member: result,
      token,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<object> {
    const member = await this.membersService.findByEmail(dto.email);
    // Always return success to avoid email enumeration
    if (!member) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    // Generate a secure random token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save to database
    await this.resetTokenRepo.save({
      token,
      member: { id: member.id } as any,
      expiresAt,
    });

    // Clean up expired tokens (async, don't await)
    this.resetTokenRepo.delete({ expiresAt: LessThan(new Date()) }).catch(err => {
      console.error('Failed to cleanup expired tokens:', err);
    });

    // TODO: Send email with reset link
    // Email sending will be implemented in notifications service

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<object> {
    const entry = await this.resetTokenRepo.findOne({
      where: { token },
      relations: { member: true },
    });

    if (!entry) throw new BadRequestException('Invalid or expired reset token');

    if (new Date() > entry.expiresAt) {
      await this.resetTokenRepo.delete({ token });
      throw new BadRequestException('Reset token has expired');
    }

    await this.membersService.updatePassword(entry.member.id, newPassword);
    await this.resetTokenRepo.delete({ token });

    return { message: 'Password updated successfully' };
  }

  /**
   * Send OTP to email for verification
   */
  async sendOtp(dto: SendOtpDto): Promise<object> {
    const { email, purpose } = dto;

    // Check if email already exists for registration purpose
    if (purpose === 'registration') {
      const existingMember = await this.membersService.findByEmail(email);
      if (existingMember) {
        throw new BadRequestException('Email already registered');
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing unverified OTPs for this email
    await this.otpRepo.delete({ email, verified: false });

    // Save OTP to database
    await this.otpRepo.save({
      email,
      otp,
      purpose,
      expiresAt,
      verified: false,
    });

    // DEVELOPMENT: Log OTP to console for testing
    console.log('='.repeat(60));
    console.log('🔐 OTP GENERATED FOR:', email);
    console.log('📧 OTP CODE:', otp);
    console.log('⏰ EXPIRES IN: 10 minutes');
    console.log('='.repeat(60));

    // Send OTP via email
    try {
      await this.notificationsService.sendEmailOtp(email, otp, 'New User');
    } catch (error) {
      // If email fails, still return success to avoid leaking info
      console.error('Failed to send OTP email:', error);
      console.log('ℹ️  EMAIL FAILED - Use OTP from console above');
    }

    // Clean up expired OTPs (async, don't await)
    this.otpRepo.delete({ expiresAt: LessThan(new Date()) }).catch(err => {
      console.error('Failed to cleanup expired OTPs:', err);
    });

    return {
      message: 'OTP sent successfully to your email',
      expiresIn: 600, // seconds
    };
  }

  /**
   * Verify OTP
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<object> {
    const { email, otp } = dto;

    const entry = await this.otpRepo.findOne({
      where: { email, otp, verified: false },
      order: { createdAt: 'DESC' },
    });

    if (!entry) {
      throw new BadRequestException('Invalid OTP');
    }

    if (new Date() > entry.expiresAt) {
      await this.otpRepo.delete({ id: entry.id });
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    // Mark OTP as verified
    await this.otpRepo.update(entry.id, { verified: true });

    // If this is for registration, mark the member's email as verified
    if (entry.purpose === 'registration') {
      const member = await this.membersService.findByEmail(email);
      if (member) {
        await this.membersService.markEmailVerified(member.id);
      }
    }

    return {
      message: 'Email verified successfully',
      verified: true,
    };
  }

  /**
   * Resend OTP
   */
  async resendOtp(email: string): Promise<object> {
    return this.sendOtp({ email, purpose: 'registration' });
  }
}
