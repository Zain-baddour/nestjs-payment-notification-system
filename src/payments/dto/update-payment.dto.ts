// src/payments/dto/update-payment.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentDto } from './create-payment.dto';
import { IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '../entities/payment.entity';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  // Only these fields should be updatable
  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ example: 'Refund for duplicate charge' })
  @IsOptional()
  refundReason?: string;

  @ApiPropertyOptional({ example: 50.00, minimum: 0.01 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  refundAmount?: number;

  @ApiPropertyOptional({ example: { adminNote: 'Customer requested refund' } })
  @IsOptional()
  refundMetadata?: Record<string, any>;
}