/**
 * Payments Controller
 *
 * HTTP endpoints for payment operations:
 *  - Create payment intent (user)
 *  - Get payment info (user)
 *  - Stripe webhook (public, signature-verified)
 *  - Refund (admin)
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Headers,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; role: UserRole };
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Create a Stripe payment intent for an order.
   */
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('create-intent')
  @ApiOperation({ summary: 'Create a Stripe payment intent for an order' })
  createPaymentIntent(@Request() req: AuthenticatedRequest, @Body() dto: CreatePaymentIntentDto) {
    return this.paymentsService.createPaymentIntent(req.user.id, dto);
  }

  /**
   * Get safe payment info for an order (for UI display).
   */
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get payment info for an order' })
  getPaymentInfo(@Request() req: AuthenticatedRequest, @Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentInfo(req.user.id, orderId);
  }

  /**
   * Stripe webhook endpoint.
   *
   * IMPORTANT: This must be public and must receive the raw body
   * (not JSON-parsed) so the signature can be verified.
   */
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint() // Hidden from Swagger — Stripe calls this, not users
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string
  ) {
    const payload = req.rawBody;
    if (!payload) {
      throw new Error('Raw body is required for webhook verification');
    }
    return this.paymentsService.handleWebhook(payload, signature);
  }

  /**
   * Refund an order (Admin only).
   */
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('refund')
  @ApiOperation({ summary: 'Refund a payment (Admin only)' })
  refund(@Body() dto: RefundPaymentDto) {
    return this.paymentsService.refund(dto);
  }
}
