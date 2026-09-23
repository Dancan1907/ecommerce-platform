import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { MpesaPaymentsController } from './mpesa/mpesa-payments.controller';
import { MpesaPaymentsService } from './mpesa/mpesa-payments.service';
import { MpesaService } from './mpesa/mpesa.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController, MpesaPaymentsController],
  providers: [PaymentsService, StripeService, MpesaPaymentsService, MpesaService],
  exports: [PaymentsService, MpesaPaymentsService],
})
export class PaymentsModule {}
