import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { MembersModule } from '../members/members.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ResetTokenEntity } from './entities/reset-token.entity';
import { EmailOtpEntity } from './entities/email-otp.entity';

@Module({
  imports: [
    MembersModule,
    NotificationsModule,
    TypeOrmModule.forFeature([ResetTokenEntity, EmailOtpEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        
        // CRITICAL: JWT_SECRET must be set in production
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        
        // Enforce minimum secret length for security
        if (secret.length < 32) {
          throw new Error('JWT_SECRET must be at least 32 characters long');
        }
        
        return {
          secret,
          signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') as any },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
