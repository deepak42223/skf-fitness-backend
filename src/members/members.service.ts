import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberEntity } from './member.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import * as bcrypt from 'bcryptjs';

export type MemberPublic = Omit<MemberEntity, 'password'>;

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(MemberEntity)
    private repo: Repository<MemberEntity>,
  ) {}

  async create(dto: CreateMemberDto): Promise<MemberPublic> {
    const exists = await this.repo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 12);
    const member = this.repo.create({
      name: dto.name,
      email: dto.email,
      password: hashed,
      phone: dto.phone,
      membershipPlan: dto.membershipPlan,
      role: 'member',
    });

    const saved = await this.repo.save(member);
    const { password, ...result } = saved;
    return result as MemberPublic;
  }

  async findAll(): Promise<MemberPublic[]> {
    const members = await this.repo.find();
    return members.map(({ password, ...m }) => m) as MemberPublic[];
  }

  async findOne(id: number): Promise<MemberPublic> {
    const member = await this.repo.findOne({ where: { id } });
    if (!member) throw new NotFoundException('Member not found');
    const { password, ...result } = member;
    return result as MemberPublic;
  }

  async findByEmail(email: string): Promise<MemberEntity | null> {
    return this.repo.findOne({ where: { email } });
  }

  async updatePassword(id: number, newPassword: string): Promise<void> {
    const hashed = await bcrypt.hash(newPassword, 12);
    await this.repo.update(id, { password: hashed });
  }

  async getStats(): Promise<object> {
    const total  = await this.repo.count();
    const active = await this.repo.count({ where: { isActive: true } });
    const basic  = await this.repo.count({ where: { membershipPlan: 'basic' } });
    const pro    = await this.repo.count({ where: { membershipPlan: 'pro' } });
    const elite  = await this.repo.count({ where: { membershipPlan: 'elite' } });
    return { total, active, plans: { basic, pro, elite } };
  }
}
