import { DriverType, StorageModule } from '@codebrew/nestjs-storage';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { forwardRef, Global, Module } from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { PromoProviderModule } from 'src/promo-provider/promo-provider.module';
import { ResponseService } from 'src/response/response.service';
import { NatsController } from './nats/nats.controller';
import { RedisPromoProviderProcessor } from './redis/promo-provider/redis-promo-provider.processor';
import { RedisPromoProviderService } from './redis/promo-provider/redis-promo-provider.service';

@Global()
@Module({
  imports: [
    StorageModule.forRoot({
      default: process.env.STORAGE_S3_STORAGE || 'local',
      disks: {
        local: {
          driver: DriverType.LOCAL,
          config: {
            root: process.cwd(),
          },
        },
        s3: {
          driver: DriverType.S3,
          config: {
            key: process.env.STORAGE_S3_KEY || '',
            secret: process.env.STORAGE_S3_SECRET || '',
            bucket: process.env.STORAGE_S3_BUCKET || '',
            region: process.env.STORAGE_S3_REGION || '',
          },
        },
      },
    }),
    BullModule.registerQueue({
      name: 'loyalties',
    }),
    HttpModule,
    forwardRef(() => PromoProviderModule),
  ],
  providers: [
    RedisPromoProviderService,
    RedisPromoProviderProcessor,
    MessageService,
    ResponseService,
  ],
  exports: [RedisPromoProviderService, RedisPromoProviderProcessor],
  controllers: [NatsController],
})
export class CommonModule {}
