import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProgressDto } from './dto/progress.dto';

export interface UserProfile {
  id: number;
  userId: number;
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  fitness_goal?: string;
  experience?: string;
  health_notes?: string;
  emergency_contact?: string;
  emergency_phone?: string;
}

export interface ProgressEntry {
  id: number;
  userId: number;
  date: string;
  weight_kg?: number;
  body_fat?: number;
  muscle_mass?: number;
  notes?: string;
  createdAt: Date;
}

export interface AttendanceRecord {
  id: number;
  userId: number;
  checkIn: Date;
  checkOut?: Date;
  durationMins?: number;
}

@Injectable()
export class ProfileService {
  // In-memory stores (replace with TypeORM entities in production)
  private profiles: UserProfile[] = [];
  private progressList: ProgressEntry[] = [];
  private attendance: AttendanceRecord[] = [];
  private nextProfileId = 1;
  private nextProgressId = 1;
  private nextAttendanceId = 1;

  getProfile(userId: number): UserProfile {
    let profile = this.profiles.find(p => p.userId === userId);
    if (!profile) {
      // Auto-create empty profile
      profile = { id: this.nextProfileId++, userId };
      this.profiles.push(profile);
    }
    return profile;
  }

  updateProfile(userId: number, dto: UpdateProfileDto): UserProfile {
    let profile = this.profiles.find(p => p.userId === userId);
    if (!profile) {
      profile = { id: this.nextProfileId++, userId, ...dto };
      this.profiles.push(profile);
    } else {
      Object.assign(profile, dto);
    }
    return profile;
  }

  getStats(userId: number): object {
    const myAttendance = this.attendance.filter(a => a.userId === userId);
    const thisMonth = new Date().getMonth();
    const monthAttendance = myAttendance.filter(
      a => new Date(a.checkIn).getMonth() === thisMonth
    );
    const myProgress = this.progressList.filter(p => p.userId === userId);
    const latest = myProgress[myProgress.length - 1];

    return {
      totalSessions: myAttendance.length,
      sessionsThisMonth: monthAttendance.length,
      currentWeight: latest?.weight_kg ?? null,
      currentBodyFat: latest?.body_fat ?? null,
      lastCheckIn: myAttendance[myAttendance.length - 1]?.checkIn ?? null,
    };
  }

  getProgress(userId: number): ProgressEntry[] {
    return this.progressList
      .filter(p => p.userId === userId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  addProgress(userId: number, dto: ProgressDto): ProgressEntry {
    const entry: ProgressEntry = {
      id: this.nextProgressId++,
      userId,
      ...dto,
      createdAt: new Date(),
    };
    this.progressList.push(entry);
    return entry;
  }

  getAttendance(userId: number): AttendanceRecord[] {
    return this.attendance
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
  }

  checkIn(userId: number): object {
    const record: AttendanceRecord = {
      id: this.nextAttendanceId++,
      userId,
      checkIn: new Date(),
    };
    this.attendance.push(record);
    return { message: 'Check-in successful', checkIn: record.checkIn, id: record.id };
  }

  checkOut(userId: number): object {
    const records = this.attendance.filter(a => a.userId === userId && !a.checkOut);
    if (!records.length) throw new NotFoundException('No active check-in found');
    const last = records[records.length - 1];
    last.checkOut = new Date();
    last.durationMins = Math.round(
      (last.checkOut.getTime() - last.checkIn.getTime()) / 60000
    );
    return { message: 'Check-out successful', duration: `${last.durationMins} mins` };
  }
}
