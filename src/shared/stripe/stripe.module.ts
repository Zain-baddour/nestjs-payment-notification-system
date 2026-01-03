// src/shared/stripe/stripe.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Global()
@Module({
  providers: [
    {
      provide: 'STRIPE_CLIENT',
      useFactory: (configService: ConfigService) => {
        const stripeSecretKey = configService.get<string>('STRIPE_SECRET_KEY');
        const isTestMode = stripeSecretKey?.startsWith('sk_test_');
        
        if (!stripeSecretKey) {
          throw new Error('STRIPE_SECRET_KEY is required in .env file');
        }

        console.log(`🔗 Initializing Stripe in ${isTestMode ? 'TEST' : 'LIVE'} mode...`);
        console.log(`   API Key: ${stripeSecretKey.substring(0, 12)}...`);
        
        try {
          const stripe = new Stripe(stripeSecretKey, {
            apiVersion: configService.get('STRIPE_API_VERSION', '2025-12-15.clover'),
            typescript: true,
            timeout: 30000, // 30 seconds for production
            maxNetworkRetries: 3,
          });
          
          // Test connection
          stripe.customers.list({ limit: 1 })
            .then(() => console.log('✅ Stripe connection successful'))
            .catch(err => console.error('❌ Stripe connection failed:', err.message));
          
          return stripe;
        } catch (error) {
          console.error('❌ Failed to initialize Stripe:', error.message);
          throw new Error(`Stripe initialization failed: ${error.message}`);
        }
      },
      inject: [ConfigService],
    },
    {
      provide: 'STRIPE_CONFIG',
      useFactory: (configService: ConfigService) => ({
        publishableKey: configService.get('STRIPE_PUBLISHABLE_KEY'),
        webhookSecret: configService.get('STRIPE_WEBHOOK_SECRET'),
        successUrl: configService.get('STRIPE_SUCCESS_URL'),
        cancelUrl: configService.get('STRIPE_CANCEL_URL'),
        currency: configService.get('STRIPE_DEFAULT_CURRENCY', 'usd'),
      }),
      inject: [ConfigService],
    },
  ],
  exports: ['STRIPE_CLIENT', 'STRIPE_CONFIG'],
})
export class StripeModule {}