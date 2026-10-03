import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { MemberEntity } from '../members/member.entity';

export enum PaymentStatus {
  CREATED = 'created',
  PAID = 'paid',
  FAILED = 'failed',
}

export enum PaymentPurpose {
  MEMBERSHIP = 'membership',
  CLASS = 'class',
  TRAINER = 'trainer',
}

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  memberId: number;

  @ManyToOne(() => MemberEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memberId' })
  member: MemberEntity;

  @Column({ unique: true })
  orderId: string;

  @Column({ nullable: true })
  razorpayOrderId: string;

  @Column({ nullable: true })
  razorpayPaymentId: string;

  @Column({ nullable: true })
  razorpaySignature: string;

  @Column({ type: 'int' })
  amount: number;

  @Column({ default: 'INR' })
  currency: string;

  @Column({ type: 'text', default: PaymentStatus.CREATED })
  status: string;

  @Column({ type: 'text' })
  purpose: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  paidAt: Date;
}
