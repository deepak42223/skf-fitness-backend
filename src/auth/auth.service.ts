import {
  Injectable, UnauthorizedException, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MembersService } from '../members/members.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  // In-memory reset tokens: token -> { memberId, expiresAt }
  // For production swap this for a DB table
  private resetTokens = new Map<string, { memberId: number; expiresAt: Date }>();

  constructor(
    private membersService: MembersService,
    private jwtService: JwtService,
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
    this.resetTokens.set(token, { memberId: member.id, expiresAt });

    // In production: send email with reset link using nodemailer/sendgrid
    // For now we log it — remove this in real production
    console.log(`[PASSWORD RESET] Token for ${dto.email}: ${token}`);

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<object> {
    const entry = this.resetTokens.get(token);
    if (!entry) throw new BadRequestException('Invalid or expired reset token');
    if (new Date() > entry.expiresAt) {
      this.resetTokens.delete(token);
      throw new BadRequestException('Reset token has expired');
    }

    await this.membersService.updatePassword(entry.memberId, newPassword);
    this.resetTokens.delete(token);
    return { message: 'Password updated successfully' };
  }
}
