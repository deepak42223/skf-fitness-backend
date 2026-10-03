import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { ClassBookingEntity } from './entities/class-booking.entity';
import { TrainerBookingEntity } from './entities/trainer-booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClassBookingEntity, TrainerBookingEntity])],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
