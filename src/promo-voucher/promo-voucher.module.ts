import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from 'src/common/common.module';
import { MessageService } from 'src/message/message.service';
import { PromoBrandModule } from 'src/promo-brand/promo-brand.module';
import { PromoProviderModule } from 'src/promo-provider/promo-provider.module';
import { ResponseService } from 'src/response/response.service';
import { VoucherModule } from 'src/voucher/voucher.module';
import { PromoVoucherController } from './promo-voucher.controller';
import { PromoVoucherService } from './promo-voucher.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    VoucherModule,
    PromoBrandModule,
    PromoProviderModule,
    CommonModule,
  ],
  controllers: [PromoVoucherController],
  providers: [PromoVoucherService, MessageService, ResponseService],
  exports: [PromoVoucherService],
})
export class PromoVoucherModule {}
