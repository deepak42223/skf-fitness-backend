import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileEntity } from './profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
  // Progress & attendance remain in-memory for now
  // (add DB entities in a future iteration)
  private progressList: ProgressEntry[] = [];
  private attendance: AttendanceRecord[] = [];
  private nextProgressId  = 1;
  private nextAttendanceId = 1;

  constructor(
    @InjectRepository(ProfileEntity)
    private profileRepo: Repository<ProfileEntity>,
  ) {}

  async getProfile(userId: number): Promise<ProfileEntity> {
    let profile = await this.profileRepo.findOne({
      where: { member: { id: userId } },
    });
    if (!profile) {
      // Auto-create empty profile
      profile = this.profileRepo.create({ member: { id: userId } as any });
      await this.profileRepo.save(profile);
    }
    return profile;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<ProfileEntity> {
    let profile = await this.profileRepo.findOne({
      where: { member: { id: userId } },
    });
    if (!profile) {
      profile = this.profileRepo.create({ member: { id: userId } as any, ...dto });
    } else {
      Object.assign(profile, dto);
    }
    return this.profileRepo.save(profile);
  }

  getStats(userId: number): object {
    const myAttendance = this.attendance.filter(a => a.userId === userId);
    const thisMonth = new Date().getMonth();
    const monthAttendance = myAttendance.filter(
      a => new Date(a.checkIn).getMonth() === thisMonth,
    );
    const myProgress = this.progressList.filter(p => p.userId === userId);
    const latest = myProgress[myProgress.length - 1];
    return {
      totalSessions:     myAttendance.length,
      sessionsThisMonth: monthAttendance.length,
      currentWeight:     latest?.weight_kg  ?? null,
      currentBodyFat:    latest?.body_fat   ?? null,
      lastCheckIn:       myAttendance[myAttendance.length - 1]?.checkIn ?? null,
    };
  }

  getProgress(userId: number): ProgressEntry[] {
    return this.progressList
      .filter(p => p.userId === userId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  addProgress(userId: number, dto: any): ProgressEntry {
    const entry: ProgressEntry = {
      id: this.nextProgressId++, userId, ...dto, createdAt: new Date(),
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
      id: this.nextAttendanceId++, userId, checkIn: new Date(),
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
      (last.checkOut.getTime() - last.checkIn.getTime()) / 60000,
    );
    return { message: 'Check-out successful', duration: `${last.durationMins} mins` };
  }
}
