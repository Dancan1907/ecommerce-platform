/**
 * MpesaCallbackDto
 *
 * Shape of the callback payload Safaricom sends to our webhook
 * after STK Push completes (success, failure, or timeout).
 *
 * Note: We don't use strict class-validator here because Safaricom's
 * callback shape is not fully under our control. We parse defensively.
 */
import { ApiProperty } from '@nestjs/swagger';

export class MpesaCallbackDto {
  @ApiProperty({ description: 'Callback body from Safaricom' })
  Body!: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value?: string | number;
        }>;
      };
    };
  };
}
