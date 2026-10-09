import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity } from './entities/payment.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { MembershipService } from '../membership/membership.service';
import { BookingsService } from '../bookings/bookings.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpayKeyId: string;
  private razorpayKeySecret: string;

  constructor(
    @InjectRepository(PaymentEntity)
    private paymentRepo: Repository<PaymentEntity>,
    private membershipService: MembershipService,
    private bookingsService: BookingsService,
    private notificationsService: NotificationsService,
  ) {
    // Use environment variables or fallback to test keys
    this.razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TlgwMoKReaQmGC';
    this.razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'wVr6Owg6bzK8H98wBh3WU6K5';
  }

  /**
   * Create a payment order — calls real Razorpay API
   */
  async createOrder(memberId: number, dto: CreateOrderDto): Promise<{
    orderId: string;
    razorpayOrderId: string;
    keyId: string;
    amount: number;
    currency: string;
  }> {
    // Generate internal order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let razorpayOrderId: string;

    try {
      // Call real Razorpay API to create order
      const https = await import('https');
      razorpayOrderId = await new Promise((resolve, reject) => {
        const body = JSON.stringify({
          amount: dto.amount * 100, // Razorpay expects paise
          currency: 'INR',
          receipt: orderId,
        });

        const credentials = Buffer.from(
          `${this.razorpayKeyId}:${this.razorpayKeySecret}`
        ).toString('base64');

        const options = {
          hostname: 'api.razorpay.com',
          path: '/v1/orders',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`,
            'Content-Length': Buffer.byteLength(body),
          },
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk: string) => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              this.logger.log(`Razorpay response: ${JSON.stringify(parsed)}`);
              if (parsed.id) {
                resolve(parsed.id);
              } else {
                reject(new Error(parsed.error?.description || `Razorpay error: ${JSON.stringify(parsed)}`));
              }
            } catch (e) {
              reject(new Error(`Invalid Razorpay response: ${data}`));
            }
          });
        });

        req.on('error', (e: Error) => {
          this.logger.error(`Razorpay request error: ${e.message}`);
          reject(e);
        });

        req.write(body);
        req.end();
      });
    } catch (error: any) {
      this.logger.error(`Failed to create Razorpay order: ${error.message}`);
      // Re-throw with a clear message for the frontend
      throw new Error(`Payment gateway error: ${error.message}`);
    }

    // Save payment record
    const payment = this.paymentRepo.create({
      memberId,
      orderId,
      razorpayOrderId,
      amount: dto.amount,
      currency: 'INR',
      status: 'created',
      purpose: dto.purpose as any,
      metadata: dto.metadata || {},
    });

    await this.paymentRepo.save(payment);

    return {
      orderId,
      razorpayOrderId,
      keyId: this.razorpayKeyId,
      amount: dto.amount,
      currency: 'INR',
    };
  }

  /**
   * Verify payment signature from Razorpay
   */
  async verifyPayment(dto: VerifyPaymentDto): Promise<{ success: boolean; message: string }> {
    // Find payment by orderId
    const payment = await this.paymentRepo.findOne({
      where: { orderId: dto.orderId },
    });

    if (!payment) {
      throw new NotFoundException('Payment order not found');
    }

    if (payment.status === 'paid') {
      throw new BadRequestException('Payment already verified');
    }

    // Verify Razorpay signature
    const isValid = this.verifyRazorpaySignature(
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
    );

    if (!isValid) {
      payment.status = 'failed';
      await this.paymentRepo.save(payment);
      throw new BadRequestException('Invalid payment signature');
    }

    // Update payment status
    payment.status = 'paid';
    payment.razorpayPaymentId = dto.razorpayPaymentId;
    payment.razorpaySignature = dto.razorpaySignature;
    payment.paidAt = new Date();

    await this.paymentRepo.save(payment);

    // Handle post-payment actions based on purpose
    await this.handlePaymentSuccess(payment);

    return {
      success: true,
      message: 'Payment verified successfully',
    };
  }

  /**
   * Verify Razorpay signature
   */
  private verifyRazorpaySignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    // Create expected signature
    const text = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.razorpayKeySecret)
      .update(text)
      .digest('hex');

    return expectedSignature === signature;
  }

  /**
   * Handle post-payment success actions
   */
  private async handlePaymentSuccess(payment: PaymentEntity): Promise<void> {
    this.logger.log(`Processing payment success for payment ID: ${payment.id}, purpose: ${payment.purpose}`);
    
    try {
      // Based on payment purpose, trigger appropriate actions
      switch (payment.purpose) {
        case 'membership':
          await this.handleMembershipPayment(payment);
          break;
        case 'class':
          await this.handleClassBookingPayment(payment);
          break;
        case 'trainer':
          await this.handleTrainerBookingPayment(payment);
          break;
        default:
          this.logger.warn(`Unknown payment purpose: ${payment.purpose}`);
          break;
      }

      // Send payment success email
      await this.sendPaymentConfirmationEmail(payment);
    } catch (error) {
      this.logger.error(`Error processing payment success for payment ${payment.id}:`, error.message);
      // Don't throw error to prevent payment verification from failing
      // Log the error for manual review
    }
  }

  /**
   * Handle membership payment - activate membership
   */
  private async handleMembershipPayment(payment: PaymentEntity): Promise<void> {
    const planId = payment.metadata?.planId || payment.metadata?.plan;
    
    if (!planId) {
      this.logger.warn(`No planId found in payment metadata for payment ${payment.id}`);
      return;
    }

    try {
      // Activate membership
      await this.membershipService.activateMembership(payment.memberId, planId);
      this.logger.log(`Membership activated for member ${payment.memberId}, plan: ${planId}`);

      // Send membership activation email
      const plan = this.membershipService.getPlanById(planId);
      if (plan) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // 1 month validity

        await this.notificationsService.sendMembershipActivated({
          memberName: payment.metadata?.memberName || 'Member',
          memberEmail: payment.metadata?.memberEmail || '',
          planName: plan.name,
          amount: payment.amount,
          startDate,
          endDate,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to activate membership for payment ${payment.id}:`, error.message);
    }
  }

  /**
   * Handle class booking payment - confirm booking
   */
  private async handleClassBookingPayment(payment: PaymentEntity): Promise<void> {
    const bookingId = payment.metadata?.bookingId;
    
    if (!bookingId) {
      this.logger.warn(`No bookingId found in payment metadata for payment ${payment.id}`);
      return;
    }

    try {
      // Confirm booking
      await this.bookingsService.confirmBookingPayment(bookingId, 'class', payment.id);
      this.logger.log(`Class booking ${bookingId} confirmed for payment ${payment.id}`);

      // Send booking confirmation email
      await this.notificationsService.sendBookingConfirmation({
        memberName: payment.metadata?.memberName || 'Member',
        memberEmail: payment.metadata?.memberEmail || '',
        bookingType: 'class',
        name: payment.metadata?.className || 'Class',
        date: payment.metadata?.date || '',
        time: payment.metadata?.timeSlot || '',
        amount: payment.amount,
      });
    } catch (error) {
      this.logger.error(`Failed to confirm class booking for payment ${payment.id}:`, error.message);
    }
  }

  /**
   * Handle trainer booking payment - confirm booking
   */
  private async handleTrainerBookingPayment(payment: PaymentEntity): Promise<void> {
    const bookingId = payment.metadata?.bookingId;
    
    if (!bookingId) {
      this.logger.warn(`No bookingId found in payment metadata for payment ${payment.id}`);
      return;
    }

    try {
      // Confirm booking
      await this.bookingsService.confirmBookingPayment(bookingId, 'trainer', payment.id);
      this.logger.log(`Trainer booking ${bookingId} confirmed for payment ${payment.id}`);

      // Send booking confirmation email
      await this.notificationsService.sendBookingConfirmation({
        memberName: payment.metadata?.memberName || 'Member',
        memberEmail: payment.metadata?.memberEmail || '',
        bookingType: 'trainer',
        name: payment.metadata?.trainerName || 'Trainer',
        date: payment.metadata?.date || '',
        time: payment.metadata?.startTime || '',
        duration: payment.metadata?.duration,
        amount: payment.amount,
      });
    } catch (error) {
      this.logger.error(`Failed to confirm trainer booking for payment ${payment.id}:`, error.message);
    }
  }

  /**
   * Send payment confirmation email
   */
  private async sendPaymentConfirmationEmail(payment: PaymentEntity): Promise<void> {
    try {
      await this.notificationsService.sendPaymentSuccess({
        memberName: payment.metadata?.memberName || 'Member',
        memberEmail: payment.metadata?.memberEmail || '',
        amount: payment.amount,
        currency: payment.currency,
        purpose: this.formatPurpose(payment.purpose),
        razorpayPaymentId: payment.razorpayPaymentId || '',
        paidAt: payment.paidAt || new Date(),
      });
    } catch (error) {
      this.logger.error(`Failed to send payment confirmation email for payment ${payment.id}:`, error.message);
    }
  }

  /**
   * Format payment purpose for display
   */
  private formatPurpose(purpose: string): string {
    const purposeMap: Record<string, string> = {
      'membership': 'Membership Plan',
      'class': 'Class Booking',
      'trainer': 'Personal Training Session',
    };
    return purposeMap[purpose] || purpose;
  }

  /**
   * Get user's payment history
   */
  async getPaymentHistory(memberId: number): Promise<PaymentEntity[]> {
    return this.paymentRepo.find({
      where: { memberId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get single payment by ID
   */
  async getPayment(id: number, memberId: number): Promise<PaymentEntity> {
    const payment = await this.paymentRepo.findOne({
      where: { id, memberId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  /**
   * Get Razorpay key for frontend
   */
  getRazorpayKey(): string {
    return this.razorpayKeyId;
  }
}
