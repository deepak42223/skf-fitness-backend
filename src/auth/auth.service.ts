import { Injectable, UnauthorizedException } from '@nestjs/common';
import { MembersService } from '../members/members.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private membersService: MembersService) {}

  async login(dto: LoginDto): Promise<object> {
    const member = this.membersService.findByEmail(dto.email);
    if (!member) throw new UnauthorizedException('Invalid email or password');

    const isValid = await bcrypt.compare(dto.password, member.password);
    if (!isValid) throw new UnauthorizedException('Invalid email or password');

    const { password, ...result } = member;
    return {
      message: 'Login successful',
      member: result,
      token: `skf-token-${result.id}-${Date.now()}`,
    };
  }
}
