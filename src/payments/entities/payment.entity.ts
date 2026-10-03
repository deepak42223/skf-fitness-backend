import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MemberEntity } from '../../members/member.entity';

export type PaymentStatus = 'created' | 'paid' | 'failed' | 'refunded';
export type PaymentPurpose = 'membership' | 'class' | 'trainer' | 'other';

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  memberId: number;

  @ManyToOne(() => MemberEntity)
  @JoinColumn({ name: 'memberId' })
  member: MemberEntity;

  // Internal order ID
  @Column({ unique: true })
  orderId: string;

  // Razorpay identifiers
  @Column({ nullable: true })
  razorpayOrderId: string;

  @Column({ nullable: true })
  razorpayPaymentId: string;

  @Column({ nullable: true })
  razorpaySignature: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'INR' })
  currency: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'created',
  })
  status: PaymentStatus;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'other',
  })
  purpose: PaymentPurpose;

  // Store booking ID, membership plan, etc.
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  paidAt: Date;
}
