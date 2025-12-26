import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
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
  
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole; // ⭐ غير من string إلى UserRole مباشرة
  
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isActive?: boolean;
}