import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

export enum BookingStatus {
  PENDING   = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

@Entity('class_bookings')
export class ClassBookingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  memberId: number;

  @Column()
  classId: string;

  @Column()
  className: string;

  @Column()
  date: string; // YYYY-MM-DD format

  @Column()
  timeSlot: string;

  @Column({ type: 'text', default: BookingStatus.PENDING })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
