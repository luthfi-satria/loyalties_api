import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { VoucherPackagesService } from 'src/voucher-packages/voucher-packages.service';

@Processor('loyalties')
export class RedisVoucherPackageProcessor {
  constructor(private readonly voucherPackageService: VoucherPackagesService) {}
  private readonly logger = new Logger(RedisVoucherPackageProcessor.name);

  @Process('autoStartVoucherPackage')
  async handleAutoStartVoucherPackage(job: Job) {
    try {
      this.logger.debug(
        'AUTO START VOUCHER CODE QUEUE EXECUTED. ID: ' +
          job.data.voucher_package_id,
      );
      await this.voucherPackageService.updateVoucherPackageStatusActive({
        voucher_package_id: job.data.voucher_package_id,
      });
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  @Process('autoFinishVoucherPackage')
  async handleAutoFinishVoucherPackage(job: Job) {
    try {
      this.logger.debug(
        'AUTO FINISH VOUCHER CODE QUEUE EXECUTED. ID: ' +
          job.data.voucher_package_id,
      );
      await this.voucherPackageService.updateVoucherPackageStatusFinished({
        voucher_package_id: job.data.voucher_package_id,
      });
    } catch (error) {
      this.logger.error(error.message);
    }
  }
}
