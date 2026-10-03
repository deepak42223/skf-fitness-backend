import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule }   from './database/database.module';
import { MembersModule }    from './members/members.module';
import { AuthModule }       from './auth/auth.module';
import { ContactModule }    from './contact/contact.module';
import { MembershipModule } from './membership/membership.module';
import { ProfileModule }    from './profile/profile.module';
import { AdminModule }      from './admin/admin.module';
import { BookingsModule }   from './bookings/bookings.module';

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
  ],
  providers: [
    // Apply ThrottlerGuard globally to every route
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
