/**
 * M-Pesa Payments Controller
 *
 * Endpoints for M-Pesa STK Push flow:
 *  - POST /payments/mpesa/stkpush (user)
 *  - POST /payments/mpesa/callback (public, Safaricom-called)
 */

import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { MpesaPaymentsService } from './mpesa-payments.service';
import { StkPushDto } from './dto/stk-push.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; role: UserRole };
}

@ApiTags('Payments')
@Controller('payments/mpesa')
export class MpesaPaymentsController {
  constructor(private readonly mpesaPaymentsService: MpesaPaymentsService) {}

  /**
   * Initiate an STK Push for an order.
   */
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('stkpush')
  @ApiOperation({ summary: 'Initiate M-Pesa STK Push for an order' })
  initiateStkPush(@Request() req: AuthenticatedRequest, @Body() dto: StkPushDto) {
    return this.mpesaPaymentsService.initiateStkPush(req.user.id, dto);
  }

  /**
   * Safaricom callback endpoint.
   * Public — Safaricom's servers call this directly.
   * Never exposed in Swagger (Safaricom-only).
   *
   * Note: body is typed as 'any' so the global ValidationPipe
   * has no metatype to validate — M-Pesa owns the callback shape.
   */
  @Public()
  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  handleCallback(@Body() body: any) {
    return this.mpesaPaymentsService.handleCallback(body);
  }
}
