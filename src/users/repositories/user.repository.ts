import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserMapper } from '../mappers/user.mapper';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

   async create(createUserDto: CreateUserDto): Promise<User> {
    // ⭐️ استدعاء المابير (هو بدو async الآن)
    const userData = await UserMapper.toEntity(createUserDto);
    const user = this.userRepository.create(userData);
    return await this.userRepository.save(user);
  }

  // في UserRepository
async validatePassword(email: string, password: string): Promise<User | null> {
  // 1. جيب اليوزر مع الباسوورد
  const user = await this.findByEmail(email);
  if (!user) return null;
  
  // 2. تحقق من الباسوورد مباشرة (بدون Mapper)
  const isValid = await UserMapper.validatePassword(password, user.password);
  if (!isValid) return null;

  // 3. إرجع اليوزر بدون الباسوورد
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

  async findAll(
    page: number = 1,
    limit: number = 10,
    relations: string[] = []
  ): Promise<{ data: User[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    
    const [data, total] = await this.userRepository.findAndCount({
      skip,
      take: limit,
      relations,
      order: { createdAt: 'DESC' },
    });
    
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, relations: string[] = []): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile'],
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }

  async findByEmail(email: string, relations: string[] = []): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
      relations: ['profile'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // ⭐️ تحديث مع المابير
    const updateData = await UserMapper.toUpdateEntity(updateUserDto);
    
    if (Object.keys(updateData).length > 0) {
      await this.userRepository.update(id, updateData);
    }
    
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async softRemove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.softRemove(user);
  }

  async count(where?: FindOptionsWhere<User>): Promise<number> {
    return await this.userRepository.count({ where });
  }

  async exists(email: string): Promise<boolean> {
    const count = await this.userRepository.count({ where: { email } });
    return count > 0;
  }
}