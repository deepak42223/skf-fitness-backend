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
    memberId: 1,
    age: 25,
    gender: 'male',
    height: 175,
    weight: 70,
    goals: 'Build muscle',
    medicalConditions: null,
    emergencyContact: '1234567890',
    address: '123 Main St',
    createdAt: new Date(),
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
      expect(profileRepo.findOne).toHaveBeenCalledWith({ where: { memberId: 1 } });
    });

    it('should auto-create profile if not exists', async () => {
      profileRepo.findOne.mockResolvedValue(null);
      profileRepo.save.mockResolvedValue({ memberId: 1 } as any);

      const result = await service.getProfile(1);

      expect(profileRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('memberId', 1);
    });
  });

  describe('updateProfile', () => {
    it('should update existing profile', async () => {
      const updateDto = {
        age: 26,
        weight: 72,
        goals: 'Lose weight',
      };

      profileRepo.findOne.mockResolvedValue(mockProfile as any);
      profileRepo.save.mockResolvedValue({ ...mockProfile, ...updateDto } as any);

      const result = await service.updateProfile(1, updateDto);

      expect(result.age).toBe(26);
      expect(result.weight).toBe(72);
      expect(profileRepo.save).toHaveBeenCalled();
    });

    it('should create profile if not exists during update', async () => {
      const updateDto = {
        age: 26,
        weight: 72,
      };

      profileRepo.findOne.mockResolvedValue(null);
      profileRepo.save.mockResolvedValue({ memberId: 1, ...updateDto } as any);

      const result = await service.updateProfile(1, updateDto);

      expect(result).toHaveProperty('memberId', 1);
      expect(result).toHaveProperty('age', 26);
    });
  });

  describe('getStats', () => {
    it('should return profile stats summary', async () => {
      profileRepo.findOne.mockResolvedValue(mockProfile as any);

      const result = await service.getStats(1);

      expect(result).toHaveProperty('age');
      expect(result).toHaveProperty('weight');
      expect(result).toHaveProperty('height');
    });

    it('should throw NotFoundException if profile not found', async () => {
      profileRepo.findOne.mockResolvedValue(null);

      await expect(service.getStats(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete profile', async () => {
      profileRepo.findOne.mockResolvedValue(mockProfile as any);
      const mockDelete = jest.fn().mockResolvedValue({ affected: 1 });
      profileRepo.delete = mockDelete;

      await service.deleteProfile(1);

      expect(mockDelete).toHaveBeenCalledWith({ memberId: 1 });
    });

    it('should throw NotFoundException if profile does not exist', async () => {
      profileRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteProfile(1)).rejects.toThrow(NotFoundException);
    });
  });
});
