import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule }   from './database/database.module';
import { MembersModule }    from './members/members.module';
import { AuthModule }       from './auth/auth.module';
import { ContactModule }    from './contact/contact.module';
import { MembershipModule } from './membership/membership.module';
import { ProfileModule }    from './profile/profile.module';
import { AdminModule }      from './admin/admin.module';
import { BookingsModule }   from './bookings/bookings.module';
import { PaymentsModule }   from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule }     from './health/health.module';
import { CustomThrottlerGuard } from './auth/guards/custom-throttler.guard';

@Module({
  imports: [
    // Load .env first so all other modules can use ConfigService
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting: 100 requests per 60 seconds per IP globally
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    // Database (SQLite via TypeORM)
    DatabaseModule,

    // Feature modules
    MembersModule,
    AuthModule,
    ContactModule,
    MembershipModule,
    ProfileModule,
    AdminModule,
    BookingsModule,
    PaymentsModule,
    NotificationsModule,
    HealthModule,
  ],
  providers: [
    // Apply CustomThrottlerGuard globally to every route
    // Uses per-user tracking for auth endpoints, IP-based for others
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
  ],
})
export class AppModule {}
