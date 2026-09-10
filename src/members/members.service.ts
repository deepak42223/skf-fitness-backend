import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import * as bcrypt from 'bcryptjs';

export interface Member {
  id: number;
  name: string;
  email: string;
  password: string;
  phone: string;
  membershipPlan: string;
  joinedAt: Date;
  isActive: boolean;
}

export type MemberPublic = Omit<Member, 'password'>;

@Injectable()
export class MembersService {
  private members: Member[] = [];
  private nextId = 1;

  async create(dto: CreateMemberDto): Promise<MemberPublic> {
    const exists = this.members.find(m => m.email === dto.email);
    if (exists) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const member: Member = {
      id: this.nextId++,
      name: dto.name,
      email: dto.email,
      password: hashed,
      phone: dto.phone,
      membershipPlan: dto.membershipPlan,
      joinedAt: new Date(),
      isActive: true,
    };

    this.members.push(member);
    const { password, ...result } = member;
    return result;
  }

  findAll(): MemberPublic[] {
    return this.members.map(({ password, ...m }) => m);
  }

  findOne(id: number): MemberPublic {
    const member = this.members.find(m => m.id === id);
    if (!member) throw new NotFoundException('Member not found');
    const { password, ...result } = member;
    return result;
  }

  findByEmail(email: string): Member | undefined {
    return this.members.find(m => m.email === email);
  }

  getStats(): object {
    return {
      total: this.members.length,
      active: this.members.filter(m => m.isActive).length,
      plans: {
        basic: this.members.filter(m => m.membershipPlan === 'basic').length,
        pro:   this.members.filter(m => m.membershipPlan === 'pro').length,
        elite: this.members.filter(m => m.membershipPlan === 'elite').length,
      }
    };
  }
}
