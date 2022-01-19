import { VoucherCodesRepository } from './../voucher_code/repository/voucher_code.repository';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PromoBrandRepository } from 'src/database/repository/promo-brand.repository';
import { CommonModule } from 'src/common/common.module';
import { VouchersRepository } from 'src/voucher/repository/voucher.repository';
import { PromoBrandController } from './promo-brand.controller';
import { PromoBrandService } from './promo-brand.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PromoBrandRepository,
      VouchersRepository,
      VoucherCodesRepository,
    ]),
    ConfigModule,
    HttpModule,
    forwardRef(() => CommonModule),
    // VoucherModule,
  ],
  controllers: [PromoBrandController],
  providers: [PromoBrandService, MessageService, ResponseService],
  exports: [PromoBrandService, TypeOrmModule],
})
export class PromoBrandModule {}
