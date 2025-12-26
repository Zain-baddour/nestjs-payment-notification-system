import { Injectable, ConflictException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto) {
    // التحقق من عدم وجود المستخدم
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    
    // ⭐️ الآن create فيها async bcrypt hashing
    const user = await this.userRepository.create(createUserDto);
    
    // إرجاع المستخدم بدون الباسورد
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll(page?: number, limit?: number) {
    return this.userRepository.findAll(page, limit);
  }

  async findOne(id: string) {
    return this.userRepository.findById(id);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return this.userRepository.update(id, updateUserDto);
  }

  async remove(id: string) {
    return this.userRepository.remove(id);
  }

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    
    if (user && await user.validatePassword(password)) {
      const { password, ...result } = user;
      return result;
    }
    
    return null;
  }
}