import { Module } from '@nestjs/common';
import { VoucherPackagesCustomersService } from './voucher-packages-customers.service';
import { VoucherPackagesCustomersController } from './voucher-packages-customers.controller';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherPackageOrderRepository } from './repository/voucher_package_order.repository';
import { VoucherPackagesRepository } from 'src/voucher-packages/repository/voucher_package.repository';
import { VoucherPackagesModule } from 'src/voucher-packages/voucher-packages.module';
import { VoucherPackagesService } from 'src/voucher-packages/voucher-packages.service';
import { MasterVoucherModule } from 'src/master_vouchers/master_voucher.module';
import { DateTimeUtils } from 'src/utils/date-time-utils';
import { VoucherModule } from 'src/voucher/voucher.module';
import { MasterVoucherVoucherCodeModule } from 'src/master_voucher_voucher_code/master_voucher_voucher_code.module';
import { MasterVoucherVoucherCodeService } from 'src/master_voucher_voucher_code/master_voucher_voucher_code.service';
import { AdminService } from 'src/common/admins/admin.service';
import { HttpService } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VoucherPackageOrderRepository,
      VoucherPackagesRepository,
    ]),
    VoucherPackagesModule,
    MasterVoucherModule,
    VoucherModule,
    MasterVoucherVoucherCodeModule,
  ],
  controllers: [VoucherPackagesCustomersController],
  providers: [
    VoucherPackagesCustomersService,
    MessageService,
    ResponseService,
    VoucherPackagesService,
    DateTimeUtils,
    MasterVoucherVoucherCodeService,
  ],
  exports: [VoucherPackagesCustomersService],
})
export class VoucherPackagesCustomersModule {}
