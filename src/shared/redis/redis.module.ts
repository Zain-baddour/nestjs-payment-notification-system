// redis.module.ts - النسخة الأكثر أماناً
import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        // ⭐ دائماً استخدم object configuration
        const options = {
          host: configService.get<string>('REDIS_HOST') ?? 'localhost',
          port: configService.get<number>('REDIS_PORT') ?? 6379,
          password: configService.get<string>('REDIS_PASSWORD'),
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          // Optional: أضف TLS/SSL إذا محتاج
          tls: configService.get('REDIS_TLS') === 'true' ? {} : undefined,
        };
        
        console.log(`🔗 Redis connecting to: ${options.host}:${options.port}`);
        
        return new Redis(options);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}