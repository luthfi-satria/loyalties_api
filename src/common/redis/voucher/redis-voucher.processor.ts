import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { VoucherService } from 'src/voucher/voucher.service';

@Processor('loyalties')
export class RedisVoucherProcessor {
  constructor(private readonly voucherService: VoucherService) {}
  private readonly logger = new Logger(RedisVoucherProcessor.name);

  @Process('autoExpireVoucher')
  async handleAutoExpireVoucher(job: Job) {
    try {
      this.logger.debug(
        'AUTO EXPIRE VOUCHER QUEUE EXECUTED. ID: ' + job.data.voucher_id,
      );
      await this.voucherService.updateVoucherStatusExpired({
        voucher_id: job.data.voucher_id,
      });
    } catch (error) {
      this.logger.error(error.message);
    }
  }
}
