// src/payments/entities/payment.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from '@/users/entities/user.entity';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CARD = 'CARD',
  WALLET = 'WALLET',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum PaymentCurrency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  SAR = 'SAR',
  AED = 'AED',
}

@Entity('payments')
@Index(['userId', 'createdAt'])
@Index(['status'])
@Index(['stripePaymentId'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentCurrency,
    default: PaymentCurrency.USD,
  })
  currency: PaymentCurrency;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  // Stripe Integration Fields
  @Column({ nullable: true, unique: true })
  stripePaymentId: string;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  stripePaymentIntentId: string;

  @Column({ nullable: true })
  stripeChargeId: string;

  // Payment Details
  @Column({ nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  paymentDetails: {
    last4?: string;
    brand?: string;
    country?: string;
    wallet?: string;
    bankName?: string;
  };

  // Refund Information
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmount: number;

  @Column({ nullable: true })
  refundReason: string;

  @Column({ type: 'jsonb', nullable: true })
  refundMetadata: Record<string, any>;

  // Relations
  @ManyToOne(() => User, (user) => user.payments, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column()
  userId: string;

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper Methods
  isRefundable(): boolean {
    return this.status === PaymentStatus.COMPLETED && 
           !this.refundAmount && 
           this.amount > 0;
  }

  getRefundableAmount(): number {
    if (!this.isRefundable()) return 0;
    return this.amount - (this.refundAmount || 0);
  }

  isFailedOrCancelled(): boolean {
    return [PaymentStatus.FAILED, PaymentStatus.CANCELLED].includes(this.status);
  }
}