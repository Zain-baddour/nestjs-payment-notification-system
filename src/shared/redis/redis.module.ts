// import { Module, Global } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import Redis from 'ioredis';

// @Global()
// @Module({
//   providers: [
//     {
//       provide: 'REDIS_CLIENT',
//       useFactory: (configService: ConfigService) => {
//         return new Redis(configService.get('REDIS_URL'), {
//           maxRetriesPerRequest: 3,
//           retryStrategy: (times) => {
//             const delay = Math.min(times * 50, 2000);
//             return delay;
//           },
//         });
//       },
//       inject: [ConfigService],
//     },
//   ],
//   exports: ['REDIS_CLIENT'],
// })
// export class RedisModule {}