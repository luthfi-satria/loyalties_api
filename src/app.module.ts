import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseService } from './database/database.service';
import { InternalModule } from './internal/internal.module';
import { PromoProviderModule } from './promo-provider/promo-provider.module';
import { SettingModule } from './settings/setting.module';
import { MasterVoucherModule } from './master_vouchers/master_voucher.module';
import { VoucherCodeModule } from './voucher_code/voucher_code.module';
import { MasterVoucherVoucherCodeModule } from './master_voucher_voucher_code/master_voucher_voucher_code.module';
import { VoucherModule } from './voucher/voucher.module';
import { VoucherPackagesModule } from './voucher-packages/voucher-packages.module';
import { PromoBrandModule } from './promo-brand/promo-brand.module';
import { VoucherPackagesCustomersModule } from './voucher-packages-customers/voucher-packages-customers.module';
import { PromoProviderUsageModule } from './promo-provider-usage/promo-provider-usage.module';
import { PromoBrandUsageModule } from './promo-brand-usage/promo-brand-usage.module';
import { PromoVoucherModule } from './promo-voucher/promo-voucher.module';
import { VoucherPosModule } from './voucher-pos/voucher-pos.module';
import { VoucherPosStoreModule } from './voucher-pos-store/voucher-pos-store.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseService,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: +process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
      },
    }),
    SettingModule,
    MasterVoucherModule,
    VoucherCodeModule,
    AuthModule,
    MasterVoucherVoucherCodeModule,
    PromoProviderModule,
    VoucherModule,
    InternalModule,
    VoucherPackagesModule,
    PromoBrandModule,
    PromoVoucherModule,
    VoucherPackagesCustomersModule,
    PromoProviderUsageModule,
    PromoBrandUsageModule,
    VoucherPosModule,
    VoucherPosStoreModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
