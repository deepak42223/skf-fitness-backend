import {
  Controller, Post, Get, Delete, Body, Param, ParseIntPipe,
  UseGuards, Request, Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateClassBookingDto } from './dto/create-class-booking.dto';
import { CreateTrainerBookingDto } from './dto/create-trainer-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  // POST /api/bookings/class
  @Post('class')
  createClassBooking(@Body() dto: CreateClassBookingDto, @Request() req: any) {
    return this.bookingsService.createClassBooking(req.user.id, dto);
  }

  // POST /api/bookings/trainer
  @Post('trainer')
  createTrainerBooking(@Body() dto: CreateTrainerBookingDto, @Request() req: any) {
    return this.bookingsService.createTrainerBooking(req.user.id, dto);
  }

  // GET /api/bookings/my-bookings
  @Get('my-bookings')
  getMyBookings(@Request() req: any) {
    return this.bookingsService.getMyBookings(req.user.id);
  }

  // GET /api/bookings/:id?type=class|trainer
  @Get(':id')
  getBookingById(
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type: 'class' | 'trainer',
    @Request() req: any,
  ) {
    return this.bookingsService.getBookingById(id, req.user.id, type);
  }

  // DELETE /api/bookings/:id?type=class|trainer
  @Delete(':id')
  cancelBooking(
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type: 'class' | 'trainer',
    @Request() req: any,
  ) {
    return this.bookingsService.cancelBooking(id, req.user.id, type);
  }
}
