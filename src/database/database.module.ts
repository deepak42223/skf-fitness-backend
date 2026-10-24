import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MemberEntity } from '../members/member.entity';
import { ContactEntity } from '../contact/contact.entity';
import { ProfileEntity } from '../profile/profile.entity';
import { ClassBookingEntity } from '../bookings/entities/class-booking.entity';
import { TrainerBookingEntity } from '../bookings/entities/trainer-booking.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { ResetTokenEntity } from '../auth/entities/reset-token.entity';
import { EmailOtpEntity } from '../auth/entities/email-otp.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbType = config.get<string>('DB_TYPE', 'better-sqlite3');
        const entities = [
          MemberEntity,
          ContactEntity,
          ProfileEntity,
          ClassBookingEntity,
          TrainerBookingEntity,
          PaymentEntity,
          ResetTokenEntity,
          EmailOtpEntity,
        ];

        // SQLite configuration (default for local development)
        if (dbType === 'better-sqlite3') {
          return {
            type: 'better-sqlite3',
            database: config.get<string>('DB_PATH', './skf-data.sqlite'),
            entities,
            synchronize: true, // auto-creates tables — fine for SQLite/dev
            logging: false,
          };
        }

        // PostgreSQL configuration (production)
        // Set DB_TYPE=postgres in .env to activate
        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            host: config.get<string>('DB_HOST'),
            port: config.get<number>('DB_PORT', 5432),
            username: config.get<string>('DB_USERNAME'),
            password: config.get<string>('DB_PASSWORD'),
            database: config.get<string>('DB_DATABASE'),
            entities,
            synchronize: false, // CRITICAL: Never auto-sync in production - use migrations
            logging: config.get<boolean>('DB_LOGGING', false),
            ssl:
              process.env.NODE_ENV === 'production'
                ? { rejectUnauthorized: false }
                : false,
          };
        }

        throw new Error(`Unsupported DB_TYPE: ${dbType}`);
      },
    }),
  ],
})
export class DatabaseModule {}
