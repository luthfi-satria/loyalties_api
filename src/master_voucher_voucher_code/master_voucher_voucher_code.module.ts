import { forwardRef, Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CommonModule } from 'src/common/common.module';
import { ConfigModule } from '@nestjs/config';
import { MasterVoucherVoucherCodeRepository } from './repository/master_voucher_voucher_code.repository';
import { MasterVoucherVoucherCodeService } from './master_voucher_voucher_code.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([MasterVoucherVoucherCodeRepository]),
    forwardRef(() => CommonModule),
  ],
  controllers: [],
  providers: [
    MessageService,
    ResponseService,
    Logger,
    MasterVoucherVoucherCodeService,
  ],
  exports: [TypeOrmModule, MasterVoucherVoucherCodeService],
})
export class MasterVoucherVoucherCodeModule {}
