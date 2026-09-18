import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, OneToOne
} from 'typeorm';
import { ProfileEntity } from '../profile/profile.entity';

export enum MembershipPlan {
  BASIC = 'basic',
  PRO   = 'pro',
  ELITE = 'elite',
}

@Entity('members')
export class MemberEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  phone: string;

  @Column({ type: 'text', default: MembershipPlan.BASIC })
  membershipPlan: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true, default: null })
  role: string; // 'admin' | 'member'

  @CreateDateColumn()
  joinedAt: Date;

  @OneToOne(() => ProfileEntity, profile => profile.member, {
    cascade: true, eager: false,
  })
  profile: ProfileEntity;
}
