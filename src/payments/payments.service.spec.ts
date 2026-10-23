import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentEntity } from './entities/payment.entity';
import { MembershipService } from '../membership/membership.service';
import { BookingsService } from '../bookings/bookings.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentRepo: jest.Mocked<Repository<PaymentEntity>>;
  let membershipService: jest.Mocked<MembershipService>;
  let bookingsService: jest.Mocked<BookingsService>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let configService: jest.Mocked<ConfigService>;

  const mockPayment = {
    id: 1,
    memberId: 1,
    amount: 5000,
    purpose: 'membership_monthly',
    status: 'pending',
    razorpayOrderId: 'order_123',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockPaymentRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const mockMembershipService = {
      activateMembership: jest.fn(),
    };

    const mockBookingsService = {
      confirmBooking: jest.fn(),
    };

    const mockNotificationsService = {
      sendPaymentConfirmation: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'RAZORPAY_KEY_ID') return 'test_key_id';
        if (key === 'RAZORPAY_KEY_SECRET') return 'test_key_secret';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(PaymentEntity),
          useValue: mockPaymentRepo,
        },
        {
          provide: MembershipService,
          useValue: mockMembershipService,
        },
        {
          provide: BookingsService,
          useValue: mockBookingsService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    paymentRepo = module.get(getRepositoryToken(PaymentEntity)) as jest.Mocked<Repository<PaymentEntity>>;
    membershipService = module.get(MembershipService) as jest.Mocked<MembershipService>;
    bookingsService = module.get(BookingsService) as jest.Mocked<BookingsService>;
    notificationsService = module.get(NotificationsService) as jest.Mocked<NotificationsService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  describe('createOrder', () => {
    it('should create order and save to database', async () => {
      const dto = {
        amount: 5000,
        purpose: 'membership_monthly',
        relatedId: null,
      };

      paymentRepo.save.mockResolvedValue({ ...mockPayment, ...dto } as any);

      // Mock Razorpay orders.create
      const mockRazorpayCreate = jest.fn().mockResolvedValue({
        id: 'order_123',
        amount: 500000,
        currency: 'INR',
      });
      (service as any).razorpay = {
        orders: { create: mockRazorpayCreate },
      };

      const result = await service.createOrder(1, dto);

      expect(result).toHaveProperty('orderId');
      expect(result).toHaveProperty('razorpayOrderId');
      expect(paymentRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException on Razorpay error', async () => {
      const dto = {
        amount: 5000,
        purpose: 'membership_monthly',
        relatedId: null,
      };

      const mockRazorpayCreate = jest.fn().mockRejectedValue(new Error('Razorpay API error'));
      (service as any).razorpay = {
        orders: { create: mockRazorpayCreate },
      };

      await expect(service.createOrder(1, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyPayment', () => {
    it('should verify valid signature and mark paid', async () => {
      const dto = {
        razorpayOrderId: 'order_123',
        razorpayPaymentId: 'pay_123',
        razorpaySignature: 'valid_signature',
      };

      paymentRepo.findOne.mockResolvedValue({
        ...mockPayment,
        status: 'pending',
      } as any);

      paymentRepo.save.mockResolvedValue({
        ...mockPayment,
        status: 'paid',
        razorpayPaymentId: 'pay_123',
      } as any);

      // Mock crypto validation
      const mockValidateSignature = jest.fn().mockReturnValue(true);
      (service as any).razorpay.utils = {
        validatePaymentVerification: mockValidateSignature,
      };

      const result = await service.verifyPayment(dto);

      expect(result).toHaveProperty('message');
      expect(paymentRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid signature', async () => {
      const dto = {
        razorpayOrderId: 'order_123',
        razorpayPaymentId: 'pay_123',
        razorpaySignature: 'invalid_signature',
      };

      paymentRepo.findOne.mockResolvedValue(mockPayment as any);

      const mockValidateSignature = jest.fn().mockReturnValue(false);
      (service as any).razorpay.utils = {
        validatePaymentVerification: mockValidateSignature,
      };

      await expect(service.verifyPayment(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for unknown orderId', async () => {
      const dto = {
        razorpayOrderId: 'unknown_order',
        razorpayPaymentId: 'pay_123',
        razorpaySignature: 'signature',
      };

      paymentRepo.findOne.mockResolvedValue(null);

      await expect(service.verifyPayment(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already paid', async () => {
      const dto = {
        razorpayOrderId: 'order_123',
        razorpayPaymentId: 'pay_123',
        razorpaySignature: 'signature',
      };

      paymentRepo.findOne.mockResolvedValue({
        ...mockPayment,
        status: 'paid',
      } as any);

      await expect(service.verifyPayment(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('handlePaymentSuccess', () => {
    it('should activate membership for membership payment', async () => {
      const payment = {
        ...mockPayment,
        purpose: 'membership_monthly',
      };

      membershipService.activateMembership.mockResolvedValue({} as any);
      notificationsService.sendPaymentConfirmation.mockResolvedValue(undefined);

      await (service as any).handlePaymentSuccess(payment);

      expect(membershipService.activateMembership).toHaveBeenCalledWith(1, 'monthly');
      expect(notificationsService.sendPaymentConfirmation).toHaveBeenCalled();
    });

    it('should confirm booking for class payment', async () => {
      const payment = {
        ...mockPayment,
        purpose: 'class_booking',
        relatedId: 5,
      };

      bookingsService.confirmBooking.mockResolvedValue({} as any);
      notificationsService.sendPaymentConfirmation.mockResolvedValue(undefined);

      await (service as any).handlePaymentSuccess(payment);

      expect(bookingsService.confirmBooking).toHaveBeenCalledWith(5, 'class');
      expect(notificationsService.sendPaymentConfirmation).toHaveBeenCalled();
    });

    it('should confirm booking for trainer payment', async () => {
      const payment = {
        ...mockPayment,
        purpose: 'trainer_booking',
        relatedId: 10,
      };

      bookingsService.confirmBooking.mockResolvedValue({} as any);
      notificationsService.sendPaymentConfirmation.mockResolvedValue(undefined);

      await (service as any).handlePaymentSuccess(payment);

      expect(bookingsService.confirmBooking).toHaveBeenCalledWith(10, 'trainer');
      expect(notificationsService.sendPaymentConfirmation).toHaveBeenCalled();
    });
  });

  describe('getRazorpayKey', () => {
    it('should return Razorpay public key', () => {
      const key = service.getRazorpayKey();
      expect(key).toBe('test_key_id');
    });
  });
});
