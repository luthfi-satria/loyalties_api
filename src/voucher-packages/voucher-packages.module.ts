import { forwardRef, Module } from '@nestjs/common';
import { VoucherPackagesService } from './voucher-packages.service';
import { VoucherPackagesController } from './voucher-packages.controller';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { MasterVoucherService } from 'src/master_vouchers/master_voucher.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherPackagesRepository } from './repository/voucher_package.repository';
import { MasterVouchersRepository } from 'src/master_vouchers/repository/master_voucher.repository';
import { DateTimeUtils } from 'src/utils/date-time-utils';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { VoucherPackagesMasterVouchersRepository } from './repository/voucher_package._master_voucher.repository';
import { CommonModule } from 'src/common/common.module';
import { VoucherModule } from 'src/voucher/voucher.module';
import { VoucherPackageOrderRepository } from '../voucher-packages-customers/repository/voucher_package_order.repository';
import { VoucherService } from 'src/voucher/voucher.service';
import { MasterVoucherModule } from 'src/master_vouchers/master_voucher.module';
import { MasterVoucherVoucherCodeModule } from 'src/master_voucher_voucher_code/master_voucher_voucher_code.module';
import { VoucherCodeModule } from 'src/voucher_code/voucher_code.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VoucherPackagesRepository,
      MasterVouchersRepository,
      VoucherPackagesMasterVouchersRepository,
      VoucherPackageOrderRepository,
    ]),
    forwardRef(() => CommonModule),
    forwardRef(() => VoucherModule),
    forwardRef(() => MasterVoucherModule),
    forwardRef(() => MasterVoucherVoucherCodeModule),
    VoucherCodeModule,
  ],
  controllers: [VoucherPackagesController],
  providers: [
    VoucherPackagesService,
    MessageService,
    ResponseService,
    MasterVoucherService,
    DateTimeUtils,
    ImageValidationService,
    VoucherService,
  ],
})
export class VoucherPackagesModule {}
