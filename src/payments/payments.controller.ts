import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  /**
   * Create payment order (protected)
   */
  @UseGuards(JwtAuthGuard)
  @Post('create-order')
  async createOrder(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.paymentsService.createOrder(req.user.id, dto);
  }

  /**
   * Verify payment (protected)
   */
  @UseGuards(JwtAuthGuard)
  @Post('verify')
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(dto);
  }

  /**
   * Get user's payment history (protected)
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-payments')
  async getMyPayments(@Request() req: any) {
    return this.paymentsService.getPaymentHistory(req.user.id);
  }

  /**
   * Get single payment (protected)
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getPayment(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.paymentsService.getPayment(id, req.user.id);
  }

  /**
   * Get Razorpay public key (public endpoint)
   */
  @Get('config/razorpay-key')
  getRazorpayKey() {
    return {
      key: this.paymentsService.getRazorpayKey(),
    };
  }
}
