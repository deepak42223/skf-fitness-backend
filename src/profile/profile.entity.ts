import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToOne, JoinColumn, UpdateDateColumn
} from 'typeorm';
import { MemberEntity } from '../members/member.entity';

@Entity('profiles')
export class ProfileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => MemberEntity, member => member.profile, { onDelete: 'CASCADE' })
  @JoinColumn()
  member: MemberEntity;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true })
  gender: string;

  @Column({ type: 'float', nullable: true })
  height_cm: number;

  @Column({ type: 'float', nullable: true })
  weight_kg: number;

  @Column({ nullable: true })
  fitness_goal: string;

  @Column({ nullable: true })
  experience: string;

  @Column({ type: 'text', nullable: true })
  health_notes: string;

  @Column({ nullable: true })
  emergency_contact: string;

  @Column({ nullable: true })
  emergency_phone: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
