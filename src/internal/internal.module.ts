import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MasterVoucherModule } from 'src/master_vouchers/master_voucher.module';
import { MessageService } from 'src/message/message.service';
import { PromoBrandModule } from 'src/promo-brand/promo-brand.module';
import { PromoProviderModule } from 'src/promo-provider/promo-provider.module';
import { ResponseService } from 'src/response/response.service';
import { VoucherPackagesCustomersModule } from 'src/voucher-packages-customers/voucher-packages-customers.module';
import { VoucherPackagesModule } from 'src/voucher-packages/voucher-packages.module';
import { VoucherPackagesService } from 'src/voucher-packages/voucher-packages.service';
import { VoucherPosModule } from 'src/voucher-pos/voucher-pos.module';
import { VoucherModule } from 'src/voucher/voucher.module';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    PromoProviderModule,
    PromoBrandModule,
    VoucherPackagesCustomersModule,
    VoucherPackagesModule,
    MasterVoucherModule,
    VoucherModule,
    VoucherPosModule,
  ],
  controllers: [InternalController],
  providers: [
    InternalService,
    MessageService,
    ResponseService,
    VoucherPackagesService,
  ],
  exports: [InternalService],
})
export class InternalModule {}
