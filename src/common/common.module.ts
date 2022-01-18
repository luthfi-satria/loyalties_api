import { CommonStorageService } from 'src/common/storage/storage.service';
import { RedisVoucherCodeService } from './redis/voucher_code/redis-voucher_code.service';
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
import { RedisVoucherCodeProcessor } from './redis/voucher_code/redis-voucher_code.processor';
import { VoucherCodeModule } from 'src/voucher_code/voucher_code.module';
import { RedisPromoBrandProcessor } from './redis/promo-brand/redis-promo-brand.processor';
import { RedisPromoBrandService } from './redis/promo-brand/redis-promo-brand.service';
import { PromoBrandModule } from 'src/promo-brand/promo-brand.module';

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
    forwardRef(() => PromoBrandModule),
    forwardRef(() => VoucherCodeModule),
  ],
  providers: [
    RedisPromoProviderService,
    RedisPromoProviderProcessor,
    RedisVoucherCodeService,
    RedisVoucherCodeProcessor,
    RedisPromoBrandService,
    RedisPromoBrandProcessor,
    CommonStorageService,
    MessageService,
    ResponseService,
  ],
  exports: [
    RedisPromoProviderService,
    RedisPromoProviderProcessor,
    RedisVoucherCodeService,
    RedisVoucherCodeProcessor,
    RedisPromoBrandService,
    RedisPromoBrandProcessor,
    CommonStorageService,
  ],
  controllers: [NatsController],
})
export class CommonModule {}
