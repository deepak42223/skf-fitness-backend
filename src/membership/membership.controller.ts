import { Controller, Get } from '@nestjs/common';
import { MembershipService } from './membership.service';

@Controller('membership')
export class MembershipController {
  constructor(private membershipService: MembershipService) {}

  // GET /api/membership/plans
  @Get('plans')
  getPlans() {
    return this.membershipService.getPlans();
  }
}
