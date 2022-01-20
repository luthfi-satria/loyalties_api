import { forwardRef, Logger, Module } from '@nestjs/common';
import { MasterVoucherService } from './master_voucher.service';
import { MasterVoucherController } from './master_voucher.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CommonModule } from 'src/common/common.module';
import { MasterVouchersRepository } from './repository/master_voucher.repository';
import { ConfigModule } from '@nestjs/config';
import { VoucherPackagesService } from 'src/voucher-packages/voucher-packages.service';
import { VoucherPackagesRepository } from 'src/voucher-packages/repository/voucher_package.repository';
import { VoucherPackagesMasterVouchersRepository } from 'src/voucher-packages/repository/voucher_package._master_voucher.repository';
import { VoucherModule } from 'src/voucher/voucher.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([
      MasterVouchersRepository,
      VoucherPackagesRepository,
      VoucherPackagesMasterVouchersRepository,
    ]),
    forwardRef(() => CommonModule),
    VoucherModule,
  ],
  controllers: [MasterVoucherController],
  providers: [
    MasterVoucherService,
    MessageService,
    ResponseService,
    Logger,
    VoucherPackagesService,
  ],
  exports: [TypeOrmModule, MasterVoucherService],
})
export class MasterVoucherModule {}
