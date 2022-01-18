import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PromoBrandService } from 'src/promo-brand/promo-brand.service';

@Processor('loyalties')
export class RedisPromoBrandProcessor {
  constructor(private readonly promoBrandService: PromoBrandService) {}
  private readonly logger = new Logger(RedisPromoBrandProcessor.name);

  @Process('autoStartPromoBrand')
  async handleAutoStartPromoBrand(job: Job) {
    try {
      this.logger.debug(
        'AUTO START PROMO BRAND QUEUE EXECUTED. ID: ' + job.data.promo_brand_id,
      );
      await this.promoBrandService.updatePromoBrandStatusActive({
        promo_brand_id: job.data.promo_brand_id,
      });
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  @Process('autoFinishPromoBrand')
  async handleAutoFinishPromoBrand(job: Job) {
    try {
      this.logger.debug(
        'AUTO FINISH PROMO BRAND QUEUE EXECUTED. ID: ' +
          job.data.promo_brand_id,
      );
      await this.promoBrandService.updatePromoBrandStatusFinished({
        promo_brand_id: job.data.promo_brand_id,
      });
    } catch (error) {
      this.logger.error(error.message);
    }
  }
}
