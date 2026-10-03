import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { ClassBookingEntity } from './entities/class-booking.entity';
import { TrainerBookingEntity } from './entities/trainer-booking.entity';
import { CreateClassBookingDto } from './dto/create-class-booking.dto';
import { CreateTrainerBookingDto } from './dto/create-trainer-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(ClassBookingEntity)
    private classBookingRepo: Repository<ClassBookingEntity>,
    @InjectRepository(TrainerBookingEntity)
    private trainerBookingRepo: Repository<TrainerBookingEntity>,
  ) {}

  async createClassBooking(memberId: number, dto: CreateClassBookingDto): Promise<ClassBookingEntity> {
    // Capacity check: max 25 bookings per class+date+timeSlot
    const count = await this.classBookingRepo.count({
      where: {
        classId: dto.classId,
        date: dto.date,
        timeSlot: dto.timeSlot,
        status: Not('cancelled'),
      },
    });

    if (count >= 25) {
      throw new ConflictException('Class is full - maximum 25 participants reached');
    }

    // Double-booking check: member cannot have another booking at same date+time
    const existingBooking = await this.classBookingRepo.findOne({
      where: {
        memberId,
        date: dto.date,
        timeSlot: dto.timeSlot,
        status: Not('cancelled'),
      },
    });

    if (existingBooking) {
      throw new ConflictException('You already have a booking at this date and time');
    }

    // Create and save booking
    const booking = this.classBookingRepo.create({
      memberId,
      classId: dto.classId,
      className: dto.className,
      date: dto.date,
      timeSlot: dto.timeSlot,
      status: 'confirmed',
    });

    return this.classBookingRepo.save(booking);
  }

  async createTrainerBooking(memberId: number, dto: CreateTrainerBookingDto): Promise<TrainerBookingEntity> {
    // Calculate total amount
    const totalAmount = (dto.duration / 60) * dto.hourlyRate;

    // Check for overlapping trainer bookings
    const startTimeParts = dto.startTime.split(':');
    const startMinutes = parseInt(startTimeParts[0]) * 60 + parseInt(startTimeParts[1]);
    const endMinutes = startMinutes + dto.duration;

    // Get all bookings for this trainer on this date
    const existingBookings = await this.trainerBookingRepo.find({
      where: {
        trainerId: dto.trainerId,
        date: dto.date,
        status: Not('cancelled'),
      },
    });

    // Check for time conflicts
    for (const booking of existingBookings) {
      const bookingStartParts = booking.startTime.split(':');
      const bookingStartMinutes = parseInt(bookingStartParts[0]) * 60 + parseInt(bookingStartParts[1]);
      const bookingEndMinutes = bookingStartMinutes + booking.duration;

      // Check if time slots overlap
      if (
        (startMinutes >= bookingStartMinutes && startMinutes < bookingEndMinutes) ||
        (endMinutes > bookingStartMinutes && endMinutes <= bookingEndMinutes) ||
        (startMinutes <= bookingStartMinutes && endMinutes >= bookingEndMinutes)
      ) {
        throw new ConflictException('Trainer is not available at this time');
      }
    }

    // Create and save booking
    const booking = this.trainerBookingRepo.create({
      memberId,
      trainerId: dto.trainerId,
      trainerName: dto.trainerName,
      date: dto.date,
      startTime: dto.startTime,
      duration: dto.duration,
      hourlyRate: dto.hourlyRate,
      totalAmount,
      status: 'confirmed',
      notes: dto.notes || null,
    });

    return this.trainerBookingRepo.save(booking);
  }

  async getMyBookings(memberId: number): Promise<{ classBookings: ClassBookingEntity[], trainerBookings: TrainerBookingEntity[] }> {
    const classBookings = await this.classBookingRepo.find({
      where: { memberId },
      order: { date: 'DESC', createdAt: 'DESC' },
    });

    const trainerBookings = await this.trainerBookingRepo.find({
      where: { memberId },
      order: { date: 'DESC', createdAt: 'DESC' },
    });

    return { classBookings, trainerBookings };
  }

  async getBookingById(id: number, memberId: number, type: 'class' | 'trainer'): Promise<ClassBookingEntity | TrainerBookingEntity> {
    if (type === 'class') {
      const booking = await this.classBookingRepo.findOne({ where: { id } });
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }
      if (booking.memberId !== memberId) {
        throw new ConflictException('Access denied - not your booking');
      }
      return booking;
    } else {
      const booking = await this.trainerBookingRepo.findOne({ where: { id } });
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }
      if (booking.memberId !== memberId) {
        throw new ConflictException('Access denied - not your booking');
      }
      return booking;
    }
  }

  async cancelBooking(id: number, memberId: number, type: 'class' | 'trainer'): Promise<{ message: string }> {
    if (type === 'class') {
      const booking = await this.classBookingRepo.findOne({ where: { id } });
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }
      if (booking.memberId !== memberId) {
        throw new ConflictException('Access denied - not your booking');
      }
      if (booking.status === 'cancelled') {
        throw new BadRequestException('Booking is already cancelled');
      }
      booking.status = 'cancelled';
      await this.classBookingRepo.save(booking);
    } else {
      const booking = await this.trainerBookingRepo.findOne({ where: { id } });
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }
      if (booking.memberId !== memberId) {
        throw new ConflictException('Access denied - not your booking');
      }
      if (booking.status === 'cancelled') {
        throw new BadRequestException('Booking is already cancelled');
      }
      booking.status = 'cancelled';
      await this.trainerBookingRepo.save(booking);
    }

    return { message: 'Booking cancelled successfully' };
  }
}
