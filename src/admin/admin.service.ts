import { Injectable } from '@nestjs/common';
import { MembersService } from '../members/members.service';
import { ContactService } from '../contact/contact.service';
import { MembershipService } from '../membership/membership.service';

@Injectable()
export class AdminService {
  constructor(
    private membersService: MembersService,
    private contactService: ContactService,
    private membershipService: MembershipService,
  ) {}

  getDashboard(): object {
    const members = this.membersService.findAll();
    const messages = this.contactService.findAll();
    const plans = this.membershipService.getPlans();

    const planStats = {
      basic: members.filter(m => m.membershipPlan === 'basic').length,
      pro:   members.filter(m => m.membershipPlan === 'pro').length,
      elite: members.filter(m => m.membershipPlan === 'elite').length,
    };

    const revenue = {
      basic: planStats.basic * 999,
      pro:   planStats.pro   * 1799,
      elite: planStats.elite * 2999,
      total: planStats.basic * 999 + planStats.pro * 1799 + planStats.elite * 2999,
    };

    return {
      summary: {
        totalMembers:   members.length,
        activeMembers:  members.filter(m => m.isActive).length,
        totalMessages:  messages.length,
        unreadMessages: messages.filter(m => !m.isRead).length,
        plans: planStats,
      },
      revenue,
      recentMembers: members.slice(-5).reverse(),
      recentMessages: messages.slice(-5).reverse(),
    };
  }

  getAllMembers(): object {
    return this.membersService.findAll();
  }

  getMemberById(id: number): object {
    return this.membersService.findOne(id);
  }

  getStats(): object {
    return this.membersService.getStats();
  }

  getMessages(): object {
    return this.contactService.findAll();
  }
}
