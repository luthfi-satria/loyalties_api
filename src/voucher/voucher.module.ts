import { VoucherPackagesMasterVouchersRepository } from './../voucher-packages/repository/voucher_package._master_voucher.repository';
import { VoucherController } from './voucher.controller';
import { VoucherCodesRepository } from './../voucher_code/repository/voucher_code.repository';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CommonModule } from 'src/common/common.module';
import { VoucherService } from 'src/voucher/voucher.service';
import { VouchersRepository } from 'src/voucher/repository/voucher.repository';
import { VoucherCodeModule } from 'src/voucher_code/voucher_code.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VouchersRepository,
      VoucherCodesRepository,
      VoucherPackagesMasterVouchersRepository,
    ]),
    ConfigModule,
    HttpModule,
    forwardRef(() => CommonModule),
    forwardRef(() => VoucherCodeModule),
  ],
  controllers: [VoucherController],
  providers: [MessageService, ResponseService, VoucherService],
  exports: [VoucherService, TypeOrmModule],
})
export class VoucherModule {}
