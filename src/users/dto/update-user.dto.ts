import { PartialType ,ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsDateString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: true })
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  lastLogoutAt?: Date;
  
  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  lastLoginAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  @IsOptional()
  forceLogout?: boolean;

}