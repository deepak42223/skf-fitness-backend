import { Injectable } from '@nestjs/common';

@Injectable()
export class MembershipService {
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
}
