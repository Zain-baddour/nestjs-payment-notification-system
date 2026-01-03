// src/payments/repositories/payment.repository.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { 
  Repository, 
  Between, 
  FindOptionsWhere, 
  FindOneOptions,
  FindManyOptions 
} from 'typeorm';
import { 
  Payment, 
  PaymentStatus, 
  PaymentMethod,
  PaymentCurrency 
} from '../entities/payment.entity';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { UpdatePaymentDto } from '../dto/update-payment.dto';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  // ✅ الصحيحة: منفصلة تماماً عن DTO
  async create(
    createData: {
      amount: number;
      currency?: PaymentCurrency;
      method: PaymentMethod;
      status?: PaymentStatus;
      description?: string;
      metadata?: Record<string, any>;
      paymentDetails?: any;
      stripePaymentId?: string;
      stripeCustomerId?: string;
      stripePaymentIntentId?: string;
      stripeChargeId?: string;
      userId: string; // ⭐ تأتي منفصلة
    }
  ): Promise<Payment> {
    const payment = this.paymentRepository.create(createData);
    return await this.paymentRepository.save(payment);
  }

  // ✅ Helper: تحويل DTO إلى entity data
  async createFromDto(
    createPaymentDto: CreatePaymentDto, 
    userId: string,
    stripeData?: {
      stripePaymentId?: string;
      stripeCustomerId?: string;
      stripePaymentIntentId?: string;
      stripeChargeId?: string;
    }
  ): Promise<Payment> {
    const paymentData = {
      amount: createPaymentDto.amount,
      currency: createPaymentDto.currency || PaymentCurrency.USD,
      method: createPaymentDto.method,
      status: createPaymentDto.status || PaymentStatus.PENDING,
      description: createPaymentDto.description,
      metadata: createPaymentDto.metadata,
      paymentDetails: createPaymentDto.paymentDetails,
      userId,
      ...stripeData,
    };

    return this.create(paymentData);
  }

  // ✅ البحث بواسطة ID
  async findById(id: string, userId?: string): Promise<Payment> {
    const where: FindOptionsWhere<Payment> = { id };
    
    if (userId) {
      where.userId = userId;
    }

    const payment = await this.paymentRepository.findOne({
      where,
      relations: ['user'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  // ✅ البحث بواسطة stripe ID
  async findByStripeId(stripePaymentId: string): Promise<Payment | null> {
    return await this.paymentRepository.findOne({
      where: { stripePaymentId },
      relations: ['user'],
    });
  }

  // ✅ البحث العام
  async findOne(options: FindOneOptions<Payment>): Promise<Payment | null> {
    return await this.paymentRepository.findOne(options);
  }

  // ✅ الحصول على كل الـ payments مع pagination
  async findAll(
    userId?: string,
    page = 1,
    limit = 10,
    filters?: {
      status?: PaymentStatus;
      method?: PaymentMethod;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<{ data: Payment[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<Payment> = {};

    if (userId) {
      where.userId = userId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.method) {
      where.method = filters.method;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = Between(
        filters.startDate || new Date(0),
        filters.endDate || new Date(),
      );
    }

    const [data, total] = await this.paymentRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ✅ التحديث
  async update(id: string, updateData: UpdatePaymentDto | Partial<Payment>): Promise<Payment> {
    // Filter out undefined values
    const cleanData: any = {};
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        cleanData[key] = value;
      }
    });

    if (Object.keys(cleanData).length > 0) {
      await this.paymentRepository.update(id, cleanData);
    }

    return this.findById(id);
  }

  // ✅ تحديث الـ status فقط
  async updateStatus(id: string, status: PaymentStatus): Promise<Payment> {
    await this.paymentRepository.update(id, { status });
    return this.findById(id);
  }

  // ✅ إضافة بيانات Stripe
  async addStripeData(
    id: string, 
    stripeData: {
      stripePaymentId?: string;
      stripeCustomerId?: string;
      stripePaymentIntentId?: string;
      stripeChargeId?: string;
    }
  ): Promise<Payment> {
    const cleanData: any = {};
    Object.entries(stripeData).forEach(([key, value]) => {
      if (value) cleanData[key] = value;
    });

    if (Object.keys(cleanData).length > 0) {
      await this.paymentRepository.update(id, cleanData);
    }

    return this.findById(id);
  }

  // ✅ الـ refund
  async refund(
    id: string, 
    refundAmount: number, 
    refundReason?: string,
    refundMetadata?: Record<string, any>,
  ): Promise<Payment> {
    const payment = await this.findById(id);
    
    const newRefundAmount = (payment.refundAmount || 0) + refundAmount;
    const newStatus = newRefundAmount >= payment.amount ? 
      PaymentStatus.REFUNDED : PaymentStatus.COMPLETED;
    
    await this.paymentRepository.update(id, {
      refundAmount: newRefundAmount,
      refundReason,
      refundMetadata,
      status: newStatus,
    });

    return this.findById(id);
  }

  // ✅ الإحصائيات
  async getUserPaymentsTotal(userId: string): Promise<{ total: number; count: number }> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .addSelect('COUNT(payment.id)', 'count')
      .where('payment.userId = :userId', { userId })
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .getRawOne();

    return {
      total: parseFloat(result.total) || 0,
      count: parseInt(result.count) || 0,
    };
  }

  // ✅ الحذف
  async remove(id: string): Promise<void> {
    const result = await this.paymentRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
  }
}