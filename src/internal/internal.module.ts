import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessageService } from 'src/message/message.service';
import { PromoBrandModule } from 'src/promo-brand/promo-brand.module';
import { PromoProviderModule } from 'src/promo-provider/promo-provider.module';
import { ResponseService } from 'src/response/response.service';
import { VoucherPackagesCustomersModule } from 'src/voucher-packages-customers/voucher-packages-customers.module';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    PromoProviderModule,
    PromoBrandModule,
    VoucherPackagesCustomersModule,
  ],
  controllers: [InternalController],
  providers: [InternalService, MessageService, ResponseService],
  exports: [InternalService],
})
export class InternalModule {}
