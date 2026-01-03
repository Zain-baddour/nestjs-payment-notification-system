// src/payments/dto/create-payment.dto.ts
import {
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  Min,
  IsObject,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentCurrency, PaymentStatus } from '../entities/payment.entity';

// Sub-DTO for payment details
export class PaymentDetailsDto {
  @ApiPropertyOptional({ example: '4242' })
  @IsOptional()
  @IsString()
  last4?: string;

  @ApiPropertyOptional({ example: 'visa' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'US' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'apple_pay' })
  @IsOptional()
  @IsString()
  wallet?: string;

  @ApiPropertyOptional({ example: 'Chase Bank' })
  @IsOptional()
  @IsString()
  bankName?: string;
}

export class CreatePaymentDto {
  @ApiProperty({ example: 99.99, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentCurrency, default: PaymentCurrency.USD })
  @IsOptional()
  @IsEnum(PaymentCurrency)
  currency?: PaymentCurrency;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ example: 'Monthly subscription' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: { orderId: '123', product: 'Premium' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  // Stripe-specific fields
  @ApiPropertyOptional({ example: 'tok_visa' })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiPropertyOptional({ example: 'cus_123' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  saveCard?: boolean = false;

  // Payment details
  @ApiPropertyOptional({ type: PaymentDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  paymentDetails?: PaymentDetailsDto;

  // For internal use (not from API)
  @ApiPropertyOptional({ enum: PaymentStatus, description: 'INTERNAL USE ONLY' })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ example: 'pi_123', description: 'INTERNAL USE ONLY' })
  @IsOptional()
  @IsString()
  stripePaymentId?: string;

  @ApiPropertyOptional({ example: 'cus_456', description: 'INTERNAL USE ONLY' })
  @IsOptional()
  @IsString()
  stripeCustomerId?: string;
}