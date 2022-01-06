import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PromoProviderService } from 'src/promo-provider/promo-provider.service';

@Processor('loyalties')
export class RedisPromoProviderProcessor {
  constructor(private readonly promoProviderService: PromoProviderService) {}
  private readonly logger = new Logger(RedisPromoProviderProcessor.name);

  @Process('autoStartPromoProvider')
  async handleAutoStartPromoProvider(job: Job) {
    try {
      this.logger.debug(
        'AUTO START PROMO PROVIDER QUEUE EXECUTED. ID: ' +
          job.data.promo_provider_id,
      );
      await this.promoProviderService.updatePromoProviderStatusActive({
        promo_provider_id: job.data.promo_provider_id,
      });
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  @Process('autoFinishPromoProvider')
  async handleAutoFinishPromoProvider(job: Job) {
    try {
      this.logger.debug(
        'AUTO FINISH PROMO PROVIDER QUEUE EXECUTED. ID: ' +
          job.data.promo_provider_id,
      );
      await this.promoProviderService.updatePromoProviderStatusFinished({
        promo_provider_id: job.data.promo_provider_id,
      });
    } catch (error) {
      this.logger.error(error.message);
    }
  }
}
