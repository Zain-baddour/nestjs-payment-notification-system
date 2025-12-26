// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'payment_user'),
        password: configService.get('DB_PASSWORD', 'payment_pass'),
        database: configService.get('DB_NAME', 'payment_system'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('DB_SYNCHRONIZE', true),
        logging: configService.get('DB_LOGGING', true),
        // Pool settings
        extra: {
          max: 20,
          connectionTimeoutMillis: 10000,
        },
      }),
    }),
    
    // Feature Modules (بس الي اتعملوا)
    UsersModule,
    AuthModule,
    
    // ⭐ PaymentsModule والـ NotificationsModule شيلنا مؤقتاً
    // PaymentsModule, 
    // NotificationsModule,
  ],
})
export class AppModule {}