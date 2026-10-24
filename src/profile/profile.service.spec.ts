import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProfileService } from './profile.service';
import { ProfileEntity } from './profile.entity';

describe('ProfileService', () => {
  let service: ProfileService;
  let profileRepo: jest.Mocked<Repository<ProfileEntity>>;

  const mockProfile = {
    id: 1,
    member: { id: 1 },
    age: 25,
    gender: 'male',
    height_cm: 175,
    weight_kg: 70,
    fitness_goal: 'Build muscle',
    health_notes: null,
    emergency_contact: 'John Doe',
    emergency_phone: '1234567890',
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockProfileRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn((data) => data),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: getRepositoryToken(ProfileEntity),
          useValue: mockProfileRepo,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    profileRepo = module.get(getRepositoryToken(ProfileEntity)) as jest.Mocked<Repository<ProfileEntity>>;
  });

  describe('getProfile', () => {
    it('should return existing profile', async () => {
      profileRepo.findOne.mockResolvedValue(mockProfile as any);

      const result = await service.getProfile(1);

      expect(result).toEqual(mockProfile);
      expect(profileRepo.findOne).toHaveBeenCalledWith({ where: { member: { id: 1 } } });
    });

    it('should auto-create profile if not exists', async () => {
      profileRepo.findOne.mockResolvedValue(null);
      const newProfile = { member: { id: 1 }, id: 1 };
      profileRepo.create.mockReturnValue(newProfile as any);
      profileRepo.save.mockResolvedValue(newProfile as any);

      const result = await service.getProfile(1);

      expect(profileRepo.create).toHaveBeenCalled();
      expect(profileRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('member');
    });
  });

  describe('updateProfile', () => {
    it('should update existing profile', async () => {
      const updateDto = {
        age: 26,
        weight_kg: 72,
        fitness_goal: 'Lose weight',
      };

      profileRepo.findOne.mockResolvedValue(mockProfile as any);
      profileRepo.save.mockResolvedValue({ ...mockProfile, ...updateDto } as any);

      const result = await service.updateProfile(1, updateDto);

      expect(result.age).toBe(26);
      expect(result.weight_kg).toBe(72);
      expect(profileRepo.save).toHaveBeenCalled();
    });

    it('should create profile if not exists during update', async () => {
      const updateDto = {
        age: 26,
        weight_kg: 72,
      };

      profileRepo.findOne.mockResolvedValue(null);
      const newProfile = { member: { id: 1 }, ...updateDto };
      profileRepo.create.mockReturnValue(newProfile as any);
      profileRepo.save.mockResolvedValue({ ...newProfile, id: 1 } as any);

      const result = await service.updateProfile(1, updateDto);

      expect(result).toHaveProperty('id');
      expect(result.age).toBe(26);
    });
  });

  describe('getStats', () => {
    it('should return profile stats summary with in-memory data', () => {
      const result = service.getStats(1);

      expect(result).toHaveProperty('totalSessions');
      expect(result).toHaveProperty('sessionsThisMonth');
      expect(result).toHaveProperty('currentWeight');
      expect(result).toHaveProperty('currentBodyFat');
      expect(result).toHaveProperty('lastCheckIn');
    });

    it('should return null values when no progress/attendance exists', () => {
      const result = service.getStats(999);

      expect(result).toEqual({
        totalSessions: 0,
        sessionsThisMonth: 0,
        currentWeight: null,
        currentBodyFat: null,
        lastCheckIn: null,
      });
    });
  });

  describe('getProgress', () => {
    it('should return empty array when no progress exists', () => {
      const result = service.getProgress(1);
      expect(result).toEqual([]);
    });

    it('should return sorted progress entries for user', () => {
      const progressEntry = {
        date: '2025-01-01',
        weight_kg: 70,
        body_fat: 15,
      };
      
      service.addProgress(1, progressEntry);
      const result = service.getProgress(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('userId', 1);
      expect(result[0]).toHaveProperty('weight_kg', 70);
    });
  });

  describe('addProgress', () => {
    it('should add progress entry and return it', () => {
      const progressDto = {
        date: '2025-01-15',
        weight_kg: 68,
        body_fat: 14,
        notes: 'Feeling good',
      };

      const result = service.addProgress(1, progressDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('userId', 1);
      expect(result.weight_kg).toBe(68);
      expect(result.notes).toBe('Feeling good');
    });
  });

  describe('getAttendance', () => {
    it('should return empty array when no attendance exists', () => {
      const result = service.getAttendance(1);
      expect(result).toEqual([]);
    });

    it('should return sorted attendance records (newest first)', () => {
      service.checkIn(1);
      service.checkIn(1);
      
      const result = service.getAttendance(1);

      expect(result).toHaveLength(2);
      expect(result[0].checkIn.getTime()).toBeGreaterThanOrEqual(result[1].checkIn.getTime());
    });
  });

  describe('checkIn', () => {
    it('should create check-in record', () => {
      const result = service.checkIn(1);

      expect(result).toHaveProperty('message', 'Check-in successful');
      expect(result).toHaveProperty('checkIn');
      expect(result).toHaveProperty('id');
    });
  });

  describe('checkOut', () => {
    it('should update last check-in with check-out time', () => {
      service.checkIn(1);
      
      const result = service.checkOut(1);

      expect(result).toHaveProperty('message', 'Check-out successful');
      expect(result).toHaveProperty('duration');
    });

    it('should throw NotFoundException when no active check-in exists', () => {
      expect(() => service.checkOut(999)).toThrow(NotFoundException);
      expect(() => service.checkOut(999)).toThrow('No active check-in found');
    });
  });
});
