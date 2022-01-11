import { InjectQueue } from '@nestjs/bull';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Queue } from 'bull';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import {
  CreateAutoStartPromoProviderDto,
  DeleteAutoStartPromoProviderDto,
  CreateAutoFinishPromoProviderDto,
  DeleteAutoFinishPromoProviderDto,
} from '../dto/redis-promo-provider.dto';

@Injectable()
export class RedisPromoProviderService {
  constructor(
    @InjectQueue('loyalties') private readonly promoProvidersQueue: Queue,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  private readonly logger = new Logger(RedisPromoProviderService.name);

  async createAutoStartPromoProviderQueue(
    data: CreateAutoStartPromoProviderDto,
  ) {
    try {
      const queueId = `loyalties-promo_providers-start-${data.promo_provider_id}`;
      this.logger.debug('AUTO START PROMO PROVIDER CREATED. ID: ' + queueId);
      await this.promoProvidersQueue.add('autoStartPromoProvider', data, {
        delay: data.delay,
        jobId: queueId,
        backoff: {
          type: 'exponential',
          delay: 60000,
        },
      });
    } catch (error) {
      this.errorReport(error, 'general.redis.createQueueFail');
    }
  }

  async deleteAutoStartPromoProviderQueue(
    data: DeleteAutoStartPromoProviderDto,
  ) {
    try {
      const queueId = `loyalties-promo_providers-start-${data.promo_provider_id}`;
      this.logger.debug(
        'AUTO START PROMO PROVIDER QUEUE DELETED. ID: ' + queueId,
      );
      return await this.promoProvidersQueue.removeJobs(queueId);
    } catch (error) {
      this.errorReport(error, 'general.redis.deleteQueueFail');
    }
  }

  async createAutoFinishPromoProviderQueue(
    data: CreateAutoFinishPromoProviderDto,
  ) {
    try {
      const queueId = `loyalties-promo_providers-finish-${data.promo_provider_id}`;
      this.logger.debug('AUTO FINISH PROMO PROVIDER CREATED. ID: ' + queueId);
      await this.promoProvidersQueue.add('autoFinishPromoProvider', data, {
        delay: data.delay,
        jobId: queueId,
        backoff: {
          type: 'exponential',
          delay: 60000,
        },
      });
    } catch (error) {
      this.errorReport(error, 'general.redis.createQueueFail');
    }
  }

  async deleteAutoFinishPromoProviderQueue(
    data: DeleteAutoFinishPromoProviderDto,
  ) {
    try {
      const queueId = `loyalties-promo_providers-finish-${data.promo_provider_id}`;
      this.logger.debug(
        'AUTO FINISH PROMO PROVIDER QUEUE DELETED. ID: ' + queueId,
      );
      return await this.promoProvidersQueue.removeJobs(queueId);
    } catch (error) {
      this.errorReport(error, 'general.redis.deleteQueueFail');
    }
  }

  errorReport(error: any, message: string) {
    this.logger.error(error);
    console.error(error);
    if (error.message == 'Bad Request Exception') {
      throw error;
    } else {
      const errors: RMessage = {
        value: '',
        property: '',
        constraint: [this.messageService.get(message), error.message],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
  }
}
