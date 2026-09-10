import { Controller, Get, Patch, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProgressDto } from './dto/progress.dto';

// NOTE: In production, replace hardcoded userId with JWT guard:
// @UseGuards(JwtAuthGuard) and get userId from @Request() req.user.id

@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  // GET /api/profile/:userId — get full profile
  @Get(':userId')
  getProfile(@Param('userId', ParseIntPipe) userId: number): object {
    return this.profileService.getProfile(userId);
  }

  // PATCH /api/profile/:userId — update profile info
  @Patch(':userId')
  updateProfile(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateProfileDto,
  ): object {
    return this.profileService.updateProfile(userId, dto);
  }

  // GET /api/profile/:userId/stats — summary stats
  @Get(':userId/stats')
  getStats(@Param('userId', ParseIntPipe) userId: number): object {
    return this.profileService.getStats(userId);
  }

  // GET /api/profile/:userId/progress — progress history for charts
  @Get(':userId/progress')
  getProgress(@Param('userId', ParseIntPipe) userId: number): object {
    return this.profileService.getProgress(userId);
  }

  // POST /api/profile/:userId/progress — add progress entry
  @Post(':userId/progress')
  addProgress(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: ProgressDto,
  ): object {
    return this.profileService.addProgress(userId, dto);
  }

  // GET /api/profile/:userId/attendance — attendance history
  @Get(':userId/attendance')
  getAttendance(@Param('userId', ParseIntPipe) userId: number): object {
    return this.profileService.getAttendance(userId);
  }

  // POST /api/profile/:userId/checkin — check in to gym
  @Post(':userId/checkin')
  checkIn(@Param('userId', ParseIntPipe) userId: number): object {
    return this.profileService.checkIn(userId);
  }

  // POST /api/profile/:userId/checkout — check out from gym
  @Post(':userId/checkout')
  checkOut(@Param('userId', ParseIntPipe) userId: number): object {
    return this.profileService.checkOut(userId);
  }
}
