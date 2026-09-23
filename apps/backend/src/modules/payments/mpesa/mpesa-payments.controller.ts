/**
 * M-Pesa Payments Controller
 *
 * Endpoints for M-Pesa STK Push flow:
 *  - POST /payments/mpesa/stkpush (user)
 *  - POST /payments/mpesa/callback (public, Safaricom-called)
 */

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { MpesaPaymentsService } from './mpesa-payments.service';
import { StkPushDto } from './dto/stk-push.dto';
import { MpesaCallbackDto } from './dto/mpesa-callback.dto';
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
   */
  @Public()
  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  handleCallback(
    @Body(
      new ValidationPipe({
        whitelist: false,
        forbidNonWhitelisted: false,
        transform: false,
        validateCustomDecorators: false,
        skipMissingProperties: true,
      })
    )
    dto: MpesaCallbackDto
  ) {
    return this.mpesaPaymentsService.handleCallback(dto);
  }
}
