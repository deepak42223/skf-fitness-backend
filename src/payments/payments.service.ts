import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { PaymentEntity } from './payment.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;
  private razorpayKeySecret: string;

  constructor(
    @InjectRepository(PaymentEntity)
    private paymentRepo: Repository<PaymentEntity>,
    private configService: ConfigService,
  ) {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    
    this.razorpayKeySecret = keySecret;
    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  async createOrder(memberId: number, dto: CreateOrderDto) {
    // Generate unique order ID
    const orderId = crypto.randomUUID();

    // Create Razorpay order (amount in paise, so multiply by 100)
    const razorpayOrder = await this.razorpay.orders.create({
      amount: dto.amount * 100,
      currency: 'INR',
      receipt: orderId,
      notes: dto.notes || undefined,
    });

    // Save payment entity with status='created'
    const payment = this.paymentRepo.create({
      memberId,
      orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: dto.amount,
      currency: 'INR',
      status: 'created',
      purpose: dto.purpose,
      metadata: dto.metadata || null,
    });

    await this.paymentRepo.save(payment);

    // Return details for frontend Razorpay.js initialization
    return {
      orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: dto.amount,
      currency: 'INR',
      keyId: this.configService.get<string>('RAZORPAY_KEY_ID'),
    };
  }

  async verifyPayment(memberId: number, dto: VerifyPaymentDto) {
    // Find payment by razorpayOrderId
    const payment = await this.paymentRepo.findOne({
      where: { razorpayOrderId: dto.razorpayOrderId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.memberId !== memberId) {
      throw new BadRequestException('Payment does not belong to this member');
    }

    // Generate expected signature using HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', this.razorpayKeySecret)
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    // Compare signatures
    if (expectedSignature === dto.razorpaySignature) {
      // Signature matches - payment is valid
      payment.status = 'paid';
      payment.razorpayPaymentId = dto.razorpayPaymentId;
      payment.razorpaySignature = dto.razorpaySignature;
      payment.paidAt = new Date();
      await this.paymentRepo.save(payment);

      return {
        success: true,
        message: 'Payment verified successfully',
        paymentId: payment.id,
      };
    } else {
      // Signature mismatch - payment verification failed
      payment.status = 'failed';
      await this.paymentRepo.save(payment);

      throw new BadRequestException('Payment verification failed');
    }
  }

  async getPaymentHistory(memberId: number): Promise<PaymentEntity[]> {
    return this.paymentRepo.find({
      where: { memberId },
      order: { createdAt: 'DESC' },
    });
  }

  async handleWebhook(body: any, signature: string) {
    // Verify webhook signature
    const isValid = this.razorpay.webhooks.validateWebhookSignature(
      JSON.stringify(body),
      signature,
      this.razorpayKeySecret,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // Process webhook event
    if (body.event === 'payment.captured') {
      const razorpayOrderId = body.payload?.payment?.entity?.order_id;
      const razorpayPaymentId = body.payload?.payment?.entity?.id;

      if (razorpayOrderId) {
        const payment = await this.paymentRepo.findOne({
          where: { razorpayOrderId },
        });

        if (payment && payment.status !== 'paid') {
          payment.status = 'paid';
          payment.razorpayPaymentId = razorpayPaymentId;
          payment.paidAt = new Date();
          await this.paymentRepo.save(payment);
        }
      }
    }

    return { success: true, message: 'Webhook processed' };
  }
}
