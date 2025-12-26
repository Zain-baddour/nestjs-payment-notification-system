// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { UserRepository } from './repositories/user.repository';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile])],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository, TypeOrmModule],
})
export class UsersModule {}