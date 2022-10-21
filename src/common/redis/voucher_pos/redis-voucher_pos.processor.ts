import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { VoucherPosService } from 'src/voucher-pos/voucher-pos.service';

@Processor('loyalties')
export class RedisVoucherPosProcessor {
  constructor(private readonly voucherPosService: VoucherPosService) {}
  private readonly logger = new Logger(RedisVoucherPosProcessor.name);

  @Process('autoStartVoucherPos')
  async handleAutoStartVoucherPos(job: Job) {
    try {
      this.logger.debug(
        'AUTO START VOUCHER POS QUEUE EXECUTED. ID: ' + job.data.voucher_pos_id,
      );
      await this.voucherPosService.updateVoucherPosStatusActive({
        voucher_pos_id: job.data.voucher_pos_id,
      });
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  @Process('autoFinishVoucherPos')
  async handleAutoFinishVoucherPos(job: Job) {
    try {
      this.logger.debug(
        'AUTO FINISH VOUCHER CODE QUEUE EXECUTED. ID: ' +
          job.data.voucher_pos_id,
      );
      await this.voucherPosService.updateVoucherPosStatusFinished({
        voucher_pos_id: job.data.voucher_pos_id,
      });
    } catch (error) {
      this.logger.error(error.message);
    }
  }
}
