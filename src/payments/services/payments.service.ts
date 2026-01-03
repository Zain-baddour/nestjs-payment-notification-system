import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentRepository } from '../repositories/payment.repository';
import { UserRepository } from '@/users/repositories/user.repository';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { RefundPaymentDto } from '../dto/refund-payment.dto';
import { Payment, PaymentStatus, PaymentMethod } from '../entities/payment.entity';


@Injectable()
export class PaymentsService {
    constructor(
        private paymentRepository: PaymentRepository,
        private userRepository: UserRepository,
        @Inject('STRIPE_CLIENT') private stripe: any,
        @Inject('STRIPE_CONFIG') private stripeConfig: any,
    ) { }

    async createPayment(createPaymentDto: CreatePaymentDto, userId: string) {
        console.log('💳 Creating payment for user:', userId);

        // 1. تأكد من وجود المستخدم
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // 2. تحقق من البيانات
        if (createPaymentDto.amount <= 0) {
            throw new BadRequestException('Amount must be greater than 0');
        }

        // 3. أنشئ Stripe customer إذا محتاج
        let stripeCustomerId = (user as any).stripeCustomerId;

        if (!stripeCustomerId && this.stripe.customers?.create) {
            try {
                const customer = await this.stripe.customers.create({
                    email: user.email,
                    name: user.name,
                    metadata: { userId: user.id, internalId: user.id },
                });

                stripeCustomerId = customer.id;

                // حفظ في قاعدة البيانات
                await this.userRepository.update(user.id, {
                    stripeCustomerId,
                } as any);

                console.log('👤 Created Stripe customer:', stripeCustomerId);
            } catch (error) {
                console.warn('⚠️ Could not create Stripe customer:', error.message);
                // نكمل بدون customer
            }
        }

        // 4. أنشئ payment intent في Stripe
        let stripePaymentId: string | null = null;
        let clientSecret: string | null = null;

        if (this.stripe.paymentIntents?.create) {
            try {
                const amountInCents = Math.round(createPaymentDto.amount * 100);

                const paymentIntent = await this.stripe.paymentIntents.create({
                    amount: amountInCents,
                    currency: createPaymentDto.currency?.toLowerCase() || 'usd',
                    customer: stripeCustomerId,
                    metadata: {
                        userId,
                        userEmail: user.email,
                        ...createPaymentDto.metadata,
                    },
                    description: createPaymentDto.description,
                    payment_method_types: ['card'],
                    automatic_payment_methods: {
                        enabled: true,
                        allow_redirects: 'never',
                    },
                });

                stripePaymentId = paymentIntent.id;
                clientSecret = paymentIntent.client_secret;

                console.log('🔐 Stripe Payment Intent created:', stripePaymentId);
            } catch (error) {
                console.error('❌ Stripe Payment Intent creation failed:', error.message);
                // نكمل بدون Stripe (للـ mock mode)
            }
        }

        // 5. حفظ في قاعدة البيانات
        const payment = await this.paymentRepository.createFromDto(
            createPaymentDto,
            userId,
            {
                stripePaymentId: stripePaymentId ?? undefined,
                stripeCustomerId: stripeCustomerId ?? undefined,
            }
        );

        console.log('✅ Payment created in database:', payment.id);

        return {
            payment,
            clientSecret,
            publishableKey: this.stripeConfig.publishableKey,
            requiresAction: clientSecret ? true : false,
        };
    }

    async getPayment(paymentId: string, userId?: string) {
        return this.paymentRepository.findById(paymentId, userId);
    }

    async getUserPayments(userId: string, page = 1, limit = 10) {
        return this.paymentRepository.findAll(userId, page, limit);
    }

    async confirmPayment(paymentId: string, paymentMethodId?: string) {
        const payment = await this.paymentRepository.findById(paymentId);

        if (!payment.stripePaymentId) {
            throw new BadRequestException('This payment is not connected to Stripe');
        }

        if (payment.status !== PaymentStatus.PENDING) {
            throw new BadRequestException(`Payment is already ${payment.status}`);
        }

        // Confirm with Stripe
        if (this.stripe.paymentIntents?.confirm) {
            try {
                const confirmedIntent = await this.stripe.paymentIntents.confirm(
                    payment.stripePaymentId,
                    paymentMethodId ? { payment_method: paymentMethodId } : undefined,
                );

                const newStatus = confirmedIntent.status === 'succeeded'
                    ? PaymentStatus.COMPLETED
                    : PaymentStatus.FAILED;

                await this.paymentRepository.updateStatus(payment.id, newStatus);

                return {
                    payment: await this.paymentRepository.findById(paymentId),
                    stripeStatus: confirmedIntent.status,
                };
            } catch (error) {
                console.error('❌ Stripe confirmation failed:', error.message);
                throw new BadRequestException(`Payment confirmation failed: ${error.message}`);
            }
        }

        // Mock confirmation
        await this.paymentRepository.updateStatus(payment.id, PaymentStatus.COMPLETED);
        return { payment: await this.paymentRepository.findById(paymentId) };
    }

    async refundPayment(paymentId: string, refundDto: RefundPaymentDto, userId?: string) {
        const payment = await this.paymentRepository.findById(paymentId, userId);

        if (!payment.isRefundable()) {
            throw new BadRequestException('Payment is not refundable');
        }

        const refundableAmount = payment.getRefundableAmount();
        const refundAmount = refundDto.amount || refundableAmount;

        if (refundAmount > refundableAmount) {
            throw new BadRequestException(
                `Refund amount (${refundAmount}) exceeds refundable amount (${refundableAmount})`,
            );
        }

        // Process refund with Stripe
        if (this.stripe.refunds?.create && payment.stripePaymentId) {
            try {
                const refund = await this.stripe.refunds.create({
                    payment_intent: payment.stripePaymentId,
                    amount: Math.round(refundAmount * 100),
                    reason: refundDto.reason || 'requested_by_customer',
                    metadata: {
                        ...refundDto.metadata,
                        originalPaymentId: payment.id,
                        userId: payment.userId,
                    },
                });

                console.log('🔄 Stripe refund created:', refund.id);
            } catch (error) {
                console.error('❌ Stripe refund failed:', error.message);
                // نكمل في قاعدة البيانات حتى إذا Stripe فشل
            }
        }

        // Update in database
        return this.paymentRepository.refund(
            payment.id,
            refundAmount,
            refundDto.reason,
            refundDto.metadata,
        );
    }

    async cancelPayment(paymentId: string, userId?: string) {
        const payment = await this.paymentRepository.findById(paymentId, userId);

        if (payment.status !== PaymentStatus.PENDING) {
            throw new BadRequestException(`Cannot cancel payment with status: ${payment.status}`);
        }

        // Cancel in Stripe
        if (this.stripe.paymentIntents?.cancel && payment.stripePaymentId) {
            try {
                await this.stripe.paymentIntents.cancel(payment.stripePaymentId);
            } catch (error) {
                console.warn('⚠️ Stripe cancellation failed:', error.message);
            }
        }

        await this.paymentRepository.updateStatus(payment.id, PaymentStatus.CANCELLED);
        return this.paymentRepository.findById(paymentId);
    }

    // Webhook handlers
    async handlePaymentSuccess(paymentIntent: any) {
        console.log('💰 Handling successful payment:', paymentIntent.id);

        try {
            // البحث عن الـ payment بواسطة stripePaymentId
            const payment = await this.paymentRepository.findOne({
                where: { stripePaymentId: paymentIntent.id },
            });

            if (payment) {
                await this.paymentRepository.updateStatus(payment.id, PaymentStatus.COMPLETED);

                // تحديث معلومات إضافية
                if (paymentIntent.charges?.data?.[0]) {
                    const charge = paymentIntent.charges.data[0];
                    await this.paymentRepository.update(payment.id, {
                        stripeChargeId: charge.id,
                        paymentDetails: {
                            last4: charge.payment_method_details?.card?.last4,
                            brand: charge.payment_method_details?.card?.brand,
                            country: charge.payment_method_details?.card?.country,
                        },
                    } as any);
                }

                console.log(`✅ Payment ${payment.id} marked as completed`);
            } else {
                console.warn(`⚠️ No local payment found for Stripe ID: ${paymentIntent.id}`);
            }
        } catch (error) {
            console.error('❌ Error handling payment success:', error.message);
        }
    }

    async handlePaymentFailure(paymentIntent: any) {
        console.error('💥 Handling failed payment:', paymentIntent.id);

        try {
            const payment = await this.paymentRepository.findOne({
                where: { stripePaymentId: paymentIntent.id },
            });

            if (payment) {
                await this.paymentRepository.updateStatus(payment.id, PaymentStatus.FAILED);
                console.log(`❌ Payment ${payment.id} marked as failed`);
            }
        } catch (error) {
            console.error('❌ Error handling payment failure:', error.message);
        }
    }
}