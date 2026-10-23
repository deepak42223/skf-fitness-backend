import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { MemberEntity } from '../../members/member.entity';

@Entity('reset_tokens')
export class ResetTokenEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  token: string;

  @ManyToOne(() => MemberEntity)
  @JoinColumn({ name: 'memberId' })
  member: MemberEntity;

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
