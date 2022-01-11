import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { VoucherCodeService } from 'src/voucher_code/voucher_code.service';

@Processor('loyalties')
export class RedisVoucherCodeProcessor {
  constructor(private readonly voucherCodeService: VoucherCodeService) {}
  private readonly logger = new Logger(RedisVoucherCodeProcessor.name);

  @Process('autoStartVoucherCode')
  async handleAutoStartVoucherCode(job: Job) {
    try {
      this.logger.debug(
        'AUTO START VOUCHER CODE QUEUE EXECUTED. ID: ' +
          job.data.voucher_code_id,
      );
      await this.voucherCodeService.updateVoucherCodeStatusActive({
        voucher_code_id: job.data.voucher_code_id,
      });
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  @Process('autoFinishVoucherCode')
  async handleAutoFinishVoucherCode(job: Job) {
    try {
      this.logger.debug(
        'AUTO FINISH VOUCHER CODE QUEUE EXECUTED. ID: ' +
          job.data.voucher_code_id,
      );
      await this.voucherCodeService.updateVoucherCodeStatusFinished({
        voucher_code_id: job.data.voucher_code_id,
      });
    } catch (error) {
      this.logger.error(error.message);
    }
  }
}
