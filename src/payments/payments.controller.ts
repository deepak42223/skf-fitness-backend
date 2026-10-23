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
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  /**
   * Create payment order (protected)
   * Rate limit: 10 orders per hour to prevent abuse
   */
  @ApiOperation({ summary: 'Create Razorpay payment order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @Post('create-order')
  async createOrder(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.paymentsService.createOrder(req.user.id, dto);
  }

  /**
   * Verify payment (protected)
   * Rate limit: 20 verification attempts per hour
   */
  @ApiOperation({ summary: 'Verify Razorpay payment signature' })
  @ApiResponse({ status: 200, description: 'Payment verified and processed' })
  @ApiResponse({ status: 400, description: 'Invalid payment signature' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 3600000 } })
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
