import { PartialType ,ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: true })
  isActive?: boolean;
}