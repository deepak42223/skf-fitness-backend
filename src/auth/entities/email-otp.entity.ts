import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MemberEntity } from '../../members/member.entity';

@Entity('email_otps')
export class EmailOtpEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  otp: string;

  @Column()
  purpose: string; // 'registration' | 'email_change'

  @ManyToOne(() => MemberEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memberId' })
  member: MemberEntity;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  verified: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
