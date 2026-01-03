import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefundPaymentDto {
  @ApiPropertyOptional({ 
    example: 50.00,
    description: 'Partial refund amount. If not provided, full refund'
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ 
    example: 'Customer requested refund',
    description: 'Reason for refund'
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ 
    example: { internalNote: 'Refund approved by admin' },
    description: 'Additional metadata for the refund'
  })
  @IsOptional()
  metadata?: Record<string, any>;
}