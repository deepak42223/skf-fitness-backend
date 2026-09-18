import {
  Controller, Get, Patch, Post, Body,
  Param, ParseIntPipe, UseGuards, Request, ForbiddenException,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProgressDto } from './dto/progress.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  private assertSelfOrAdmin(req: any, userId: number) {
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }

  // GET /api/profile/:userId
  @Get(':userId')
  getProfile(@Param('userId', ParseIntPipe) userId: number, @Request() req: any) {
    this.assertSelfOrAdmin(req, userId);
    return this.profileService.getProfile(userId);
  }

  // PATCH /api/profile/:userId
  @Patch(':userId')
  updateProfile(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateProfileDto,
    @Request() req: any,
  ) {
    this.assertSelfOrAdmin(req, userId);
    return this.profileService.updateProfile(userId, dto);
  }

  // GET /api/profile/:userId/stats
  @Get(':userId/stats')
  getStats(@Param('userId', ParseIntPipe) userId: number, @Request() req: any) {
    this.assertSelfOrAdmin(req, userId);
    return this.profileService.getStats(userId);
  }

  // GET /api/profile/:userId/progress
  @Get(':userId/progress')
  getProgress(@Param('userId', ParseIntPipe) userId: number, @Request() req: any) {
    this.assertSelfOrAdmin(req, userId);
    return this.profileService.getProgress(userId);
  }

  // POST /api/profile/:userId/progress
  @Post(':userId/progress')
  addProgress(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: ProgressDto,
    @Request() req: any,
  ) {
    this.assertSelfOrAdmin(req, userId);
    return this.profileService.addProgress(userId, dto);
  }

  // GET /api/profile/:userId/attendance
  @Get(':userId/attendance')
  getAttendance(@Param('userId', ParseIntPipe) userId: number, @Request() req: any) {
    this.assertSelfOrAdmin(req, userId);
    return this.profileService.getAttendance(userId);
  }

  // POST /api/profile/:userId/checkin
  @Post(':userId/checkin')
  checkIn(@Param('userId', ParseIntPipe) userId: number, @Request() req: any) {
    this.assertSelfOrAdmin(req, userId);
    return this.profileService.checkIn(userId);
  }

  // POST /api/profile/:userId/checkout
  @Post(':userId/checkout')
  checkOut(@Param('userId', ParseIntPipe) userId: number, @Request() req: any) {
    this.assertSelfOrAdmin(req, userId);
    return this.profileService.checkOut(userId);
  }
}
