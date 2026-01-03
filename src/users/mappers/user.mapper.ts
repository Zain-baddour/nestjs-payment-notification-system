// src/users/mappers/user.mapper.ts
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class UserMapper {
  private static readonly SALT_ROUNDS = 10;
  
  static async toEntity(createUserDto: CreateUserDto): Promise<Partial<User>> {
    // 🔐 تشفير الباسورد هنا في المابير
    const hashedPassword = await bcrypt.hash(
      createUserDto.password, 
      this.SALT_ROUNDS
    );
    
    return {
      email: createUserDto.email,
      password: hashedPassword, // ⭐ الباسورد المشفر
      name: createUserDto.name,
      role: createUserDto.role as UserRole || UserRole.USER,
      isActive: true,
    };
  }
  
  static async toUpdateEntity(updateUserDto: UpdateUserDto): Promise<Partial<User>> {
    const entity: Partial<User> = {};
    
    if (updateUserDto.email !== undefined) {
      entity.email = updateUserDto.email;
    }
    
    if (updateUserDto.name !== undefined) {
      entity.name = updateUserDto.name;
    }
    
    // 🔐 إذا في تحديث للباسورد، شفرها
    if (updateUserDto.password !== undefined) {
      entity.password = await bcrypt.hash(
        updateUserDto.password, 
        this.SALT_ROUNDS
      );
    }
    
    if (updateUserDto.role !== undefined) {
      entity.role = updateUserDto.role as UserRole;
    }
    
    if (updateUserDto.isActive !== undefined) {
      entity.isActive = updateUserDto.isActive;
    }
    
    return entity;
  }
  
  // 🔐 دالة للتحقق من الباسورد
  static async validatePassword(
    plainPassword: string, 
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}