import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MembersModule } from '../members/members.module';
import { ContactModule } from '../contact/contact.module';
import { MembershipModule } from '../membership/membership.module';

@Module({
  imports: [MembersModule, ContactModule, MembershipModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
