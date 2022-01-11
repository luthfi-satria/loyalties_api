import { MasterVouchersRepository } from './../master_vouchers/repository/master_voucher.repository';
import { MasterVoucherService } from './../master_vouchers/master_voucher.service';
import { VoucherCodesRepository } from './repository/voucher_code.repository';
import { VoucherCodeService } from './voucher_code.service';
import { forwardRef, Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CommonModule } from 'src/common/common.module';
import { ConfigModule } from '@nestjs/config';
import { VoucherCodeController } from './voucher_code.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([
      VoucherCodesRepository,
      MasterVouchersRepository,
    ]),
    forwardRef(() => CommonModule),
  ],
  controllers: [VoucherCodeController],
  providers: [
    VoucherCodeService,
    MessageService,
    ResponseService,
    MasterVoucherService,
    Logger,
  ],
  exports: [TypeOrmModule, VoucherCodeService],
})
export class VoucherCodeModule {}
