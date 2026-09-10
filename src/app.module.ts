import { Module } from '@nestjs/common';
import { MembersModule }    from './members/members.module';
import { AuthModule }       from './auth/auth.module';
import { ContactModule }    from './contact/contact.module';
import { MembershipModule } from './membership/membership.module';
import { ProfileModule }    from './profile/profile.module';
import { AdminModule }      from './admin/admin.module';

@Module({
  imports: [
    MembersModule,
    AuthModule,
    ContactModule,
    MembershipModule,
    ProfileModule,
    AdminModule,
  ],
})
export class AppModule {}
