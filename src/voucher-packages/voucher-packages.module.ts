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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VoucherPackagesRepository,
      MasterVouchersRepository,
      VoucherPackagesMasterVouchersRepository,
    ]),
    forwardRef(() => CommonModule),
    forwardRef(() => VoucherModule),
  ],
  controllers: [VoucherPackagesController],
  providers: [
    VoucherPackagesService,
    MessageService,
    ResponseService,
    MasterVoucherService,
    DateTimeUtils,
    ImageValidationService,
  ],
})
export class VoucherPackagesModule {}
