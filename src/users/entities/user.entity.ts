import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    OneToMany,
    Index,
    BeforeInsert,
    BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { UserProfile } from './user-profile.entity';
import { Payment } from '@/payments/entities/payment.entity';
// import { Device } from '@/notifications/entities/device.entity';

export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
    MERCHANT = 'MERCHANT',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    @Index()
    email: string;

    @Column({ nullable: true })
    name: string;

    @Column()
    @Exclude() // لن يظهر في الـ responses
    password: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @Column({ default: true })
    isActive: boolean;

    // ⭐ Eager Loading: يتحمل تلقائياً مع User
    @OneToOne(() => UserProfile, (profile) => profile.user, {
        eager: true,
        cascade: true,
        nullable: true,
    })
    profile: UserProfile;

    // ⭐ Lazy Loading: يتحمل عند الطلب فقط
    @OneToMany(() => Payment, (payment) => payment.user, {
        lazy: true,
    })
    payments: Promise<Payment[]>;

    // @OneToMany(() => Device, (device) => device.user, {
    //     lazy: true,
    // })
    // devices: Promise<Device[]>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // ⭐ Hooks - تشفير الباسورد قبل الحفظ
    

    // ⭐ Method للتحقق من الباسورد
    async validatePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.password);
    }
}