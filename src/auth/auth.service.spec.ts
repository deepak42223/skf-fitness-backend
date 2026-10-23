import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { MembersService } from '../members/members.service';
import { ResetTokenEntity } from './entities/reset-token.entity';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let membersService: jest.Mocked<MembersService>;
  let jwtService: jest.Mocked<JwtService>;
  let resetTokenRepo: jest.Mocked<Repository<ResetTokenEntity>>;

  const mockMember = {
    id: 1,
    email: 'test@example.com',
    password: '$2a$10$hashedpassword',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    role: 'member',
  };

  beforeEach(async () => {
    const mockMembersService = {
      findByEmail: jest.fn(),
      updatePassword: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const mockResetTokenRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: MembersService,
          useValue: mockMembersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(ResetTokenEntity),
          useValue: mockResetTokenRepo,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    membersService = module.get(MembersService) as jest.Mocked<MembersService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    resetTokenRepo = module.get(getRepositoryToken(ResetTokenEntity)) as jest.Mocked<Repository<ResetTokenEntity>>;
  });

  describe('login', () => {
    it('should return token for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      membersService.findByEmail.mockResolvedValue({ ...mockMember, password: hashedPassword });

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('member');
      expect((result as any).member).not.toHaveProperty('password');
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      membersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'invalid@example.com', password: 'password123' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      membersService.findByEmail.mockResolvedValue({ ...mockMember, password: hashedPassword });

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive account', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      membersService.findByEmail.mockResolvedValue({
        ...mockMember,
        password: hashedPassword,
        isActive: false,
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('should save reset token for valid email', async () => {
      membersService.findByEmail.mockResolvedValue(mockMember as any);
      resetTokenRepo.save.mockResolvedValue({} as any);

      const result = await service.forgotPassword({ email: 'test@example.com' });

      expect(result).toHaveProperty('message');
      expect(resetTokenRepo.save).toHaveBeenCalled();
    });

    it('should return generic message for invalid email (prevent enumeration)', async () => {
      membersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'invalid@example.com' });

      expect(result).toHaveProperty('message');
      expect(resetTokenRepo.save).not.toHaveBeenCalled();
    });

    it('should generate unique token', async () => {
      membersService.findByEmail.mockResolvedValue(mockMember as any);
      resetTokenRepo.save.mockResolvedValue({} as any);

      await service.forgotPassword({ email: 'test@example.com' });
      await service.forgotPassword({ email: 'test@example.com' });

      const calls = resetTokenRepo.save.mock.calls;
      expect(calls[0][0].token).not.toBe(calls[1][0].token);
    });
  });

  describe('resetPassword', () => {
    it('should update password for valid token', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      resetTokenRepo.findOne.mockResolvedValue({
        id: 1,
        token: 'valid-token',
        member: mockMember as any,
        expiresAt: futureDate,
        createdAt: new Date(),
      });

      const result = await service.resetPassword('valid-token', 'newPassword123');

      expect(result).toHaveProperty('message');
      expect(membersService.updatePassword).toHaveBeenCalledWith(1, 'newPassword123');
      expect(resetTokenRepo.delete).toHaveBeenCalledWith({ token: 'valid-token' });
    });

    it('should throw BadRequestException for invalid token', async () => {
      resetTokenRepo.findOne.mockResolvedValue(null);

      await expect(
        service.resetPassword('invalid-token', 'newPassword123')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired token', async () => {
      const pastDate = new Date(Date.now() - 3600000);
      resetTokenRepo.findOne.mockResolvedValue({
        id: 1,
        token: 'expired-token',
        member: mockMember as any,
        expiresAt: pastDate,
        createdAt: new Date(),
      });

      await expect(
        service.resetPassword('expired-token', 'newPassword123')
      ).rejects.toThrow(BadRequestException);
    });

    it('should delete token after successful reset', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      resetTokenRepo.findOne.mockResolvedValue({
        id: 1,
        token: 'valid-token',
        member: mockMember as any,
        expiresAt: futureDate,
        createdAt: new Date(),
      });

      await service.resetPassword('valid-token', 'newPassword123');

      expect(resetTokenRepo.delete).toHaveBeenCalledWith({ token: 'valid-token' });
    });
  });
});
