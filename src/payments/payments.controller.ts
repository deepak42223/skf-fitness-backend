import {
  Controller, Post, Get, Body, UseGuards, Request, Headers,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // POST /api/payments/create-order - Protected endpoint
  @UseGuards(JwtAuthGuard)
  @Post('create-order')
  createOrder(@Body() dto: CreateOrderDto, @Request() req: any) {
    return this.paymentsService.createOrder(req.user.id, dto);
  }

  // POST /api/payments/verify - Protected endpoint
  @UseGuards(JwtAuthGuard)
  @Post('verify')
  verifyPayment(@Body() dto: VerifyPaymentDto, @Request() req: any) {
    return this.paymentsService.verifyPayment(req.user.id, dto);
  }

  // GET /api/payments/my-payments - Protected endpoint
  @UseGuards(JwtAuthGuard)
  @Get('my-payments')
  getMyPayments(@Request() req: any) {
    return this.paymentsService.getPaymentHistory(req.user.id);
  }

  // POST /api/payments/webhook - Public endpoint (no JWT guard)
  @Post('webhook')
  handleWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Body() body: any,
  ) {
    return this.paymentsService.handleWebhook(body, signature);
  }
}
