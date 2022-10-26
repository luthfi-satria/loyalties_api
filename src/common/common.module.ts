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
import { RedisVoucherPackageService } from './redis/voucher_package/redis-voucher_package.service';
import { RedisVoucherPackageProcessor } from './redis/voucher_package/redis-voucher_package.processor';
import { VoucherPackagesService } from 'src/voucher-packages/voucher-packages.service';
import { MasterVoucherService } from 'src/master_vouchers/master_voucher.service';
import { VoucherPackagesModule } from 'src/voucher-packages/voucher-packages.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherPackagesRepository } from 'src/voucher-packages/repository/voucher_package.repository';
import { VoucherPackagesMasterVouchersRepository } from 'src/voucher-packages/repository/voucher_package._master_voucher.repository';
import { RedisPromoBrandProcessor } from './redis/promo-brand/redis-promo-brand.processor';
import { RedisPromoBrandService } from './redis/promo-brand/redis-promo-brand.service';
import { PromoBrandModule } from 'src/promo-brand/promo-brand.module';
import { PaymentService } from './payment/payment.service';
import { VoucherModule } from 'src/voucher/voucher.module';
import { PromoProviderUsageModule } from 'src/promo-provider-usage/promo-provider-usage.module';
import { PromoBrandUsageModule } from 'src/promo-brand-usage/promo-brand-usage.module';
import { OrderService } from './order/order.service';
import { RedisVoucherService } from './redis/voucher/redis-voucher.service';
import { RedisVoucherProcessor } from './redis/voucher/redis-voucher.processor';
import { AdminService } from './admins/admin.service';

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
    forwardRef(() => VoucherPackagesModule),
    forwardRef(() => VoucherModule),
    forwardRef(() => PromoProviderUsageModule),
    forwardRef(() => PromoBrandUsageModule),
    TypeOrmModule.forFeature([
      VoucherPackagesRepository,
      VoucherPackagesMasterVouchersRepository,
    ]),
  ],
  providers: [
    RedisPromoProviderService,
    RedisPromoProviderProcessor,
    RedisVoucherCodeService,
    RedisVoucherCodeProcessor,
    RedisVoucherService,
    RedisVoucherProcessor,
    RedisVoucherPackageService,
    RedisVoucherPackageProcessor,
    RedisPromoBrandService,
    RedisPromoBrandProcessor,
    CommonStorageService,
    MessageService,
    ResponseService,
    VoucherPackagesService,
    MasterVoucherService,
    PaymentService,
    AdminService,
    OrderService,
  ],
  exports: [
    RedisPromoProviderService,
    RedisPromoProviderProcessor,
    RedisVoucherCodeService,
    RedisVoucherCodeProcessor,
    RedisVoucherService,
    RedisVoucherProcessor,
    RedisVoucherPackageService,
    RedisVoucherPackageProcessor,
    RedisPromoBrandService,
    RedisPromoBrandProcessor,
    CommonStorageService,
    PaymentService,
    AdminService,
    OrderService,
  ],
  controllers: [NatsController],
})
export class CommonModule {}
