import { IsNumber, IsString, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ example: 100.50 })
  @IsNumber()
  @Min(0.01)
  amount: number;
  
  @ApiProperty({ example: 'USD', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string = 'USD';
  
  @ApiProperty({ enum: ['CARD', 'WALLET', 'BANK_TRANSFER'] })
  @IsEnum(['CARD', 'WALLET', 'BANK_TRANSFER'])
  method: string;
  
  @ApiPropertyOptional({ example: 'Monthly subscription' })
  @IsOptional()
  @IsString()
  description?: string;
  
  @ApiPropertyOptional({ example: { orderId: '123' } })
  @IsOptional()
  metadata?: Record<string, any>;
  
  @ApiPropertyOptional({ example: 'tok_visa' })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
  
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  saveCard?: boolean;
}