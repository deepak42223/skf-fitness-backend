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
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private membersService: MembersService,
    private jwtService: JwtService,
    @InjectRepository(ResetTokenEntity)
    private resetTokenRepo: Repository<ResetTokenEntity>,
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
}
