import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberEntity } from '../members/member.entity';

@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(MemberEntity)
    private memberRepo: Repository<MemberEntity>,
  ) {}
  getPlans() {
    return [
      {
        id: 'basic',
        name: 'Basic',
        price: 999,
        currency: 'INR',
        period: 'month',
        description: 'Perfect for beginners',
        features: [
          'Gym floor access',
          'Locker room access',
          'Basic equipment use',
          '2 group classes/month',
        ],
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 1799,
        currency: 'INR',
        period: 'month',
        description: 'Most popular plan',
        featured: true,
        features: [
          'All Basic features',
          'Unlimited group classes',
          'Nutrition consultation',
          'Progress tracking app',
          '2 PT sessions/month',
        ],
      },
      {
        id: 'elite',
        name: 'Elite',
        price: 2999,
        currency: 'INR',
        period: 'month',
        description: 'For serious athletes',
        features: [
          'All Pro features',
          'Unlimited PT sessions',
          'Custom meal plan',
          'Priority booking',
          'Recovery & mobility sessions',
          'Body composition analysis',
        ],
      },
    ];
  }

  /**
   * Activate membership for a member after successful payment
   */
  async activateMembership(memberId: number, planId: string): Promise<void> {
    const member = await this.memberRepo.findOne({ where: { id: memberId } });
    
    if (!member) {
      throw new Error('Member not found');
    }

    // Update member's plan
    member.membershipPlan = planId;
    await this.memberRepo.save(member);
  }

  /**
   * Get plan details by ID
   */
  getPlanById(planId: string) {
    const plans = this.getPlans();
    return plans.find(plan => plan.id === planId);
  }
}
