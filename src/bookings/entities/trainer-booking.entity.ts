import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

export enum BookingStatus {
  PENDING   = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

@Entity('trainer_bookings')
export class TrainerBookingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  memberId: number;

  @Column()
  trainerId: string;

  @Column()
  trainerName: string;

  @Column()
  date: string; // YYYY-MM-DD format

  @Column()
  startTime: string; // HH:mm format

  @Column()
  duration: number; // minutes

  @Column({ type: 'real' })
  hourlyRate: number;

  @Column({ type: 'real' })
  totalAmount: number;

  @Column({ type: 'text', default: BookingStatus.PENDING })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}
