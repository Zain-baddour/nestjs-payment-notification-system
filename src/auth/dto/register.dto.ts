import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@/users/entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
  
  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
  
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  name: string;
  
  @ApiPropertyOptional({ enum: UserRole, default: UserRole.USER })
  @IsOptional()
  role?: UserRole;
}