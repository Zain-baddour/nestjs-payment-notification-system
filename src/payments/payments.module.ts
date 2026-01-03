import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './controllers/payments.controller';
import { PaymentsService } from './services/payments.service';
import { PaymentRepository } from './repositories/payment.repository';
import { Payment } from './entities/payment.entity';
import { UsersModule } from '@/users/users.module';
import { StripeModule } from '@/shared/stripe/stripe.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    UsersModule,
    StripeModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentRepository],
  exports: [PaymentsService],
})
export class PaymentsModule {}