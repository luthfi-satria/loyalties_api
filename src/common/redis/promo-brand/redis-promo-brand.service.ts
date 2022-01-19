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
  CreateAutoStartPromoBrandDto,
  DeleteAutoStartPromoBrandDto,
  CreateAutoFinishPromoBrandDto,
  DeleteAutoFinishPromoBrandDto,
} from '../dto/redis-promo-brand.dto';

@Injectable()
export class RedisPromoBrandService {
  constructor(
    @InjectQueue('loyalties') private readonly promoBrandsQueue: Queue,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  private readonly logger = new Logger(RedisPromoBrandService.name);

  async createAutoStartPromoBrandQueue(data: CreateAutoStartPromoBrandDto) {
    try {
      const queueId = `loyalties-promo_brands-start-${data.promo_brand_id}`;
      this.logger.debug('AUTO START PROMO BRAND CREATED. ID: ' + queueId);
      await this.promoBrandsQueue.add('autoStartPromoBrand', data, {
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

  async deleteAutoStartPromoBrandQueue(data: DeleteAutoStartPromoBrandDto) {
    try {
      const queueId = `loyalties-promo_brands-start-${data.promo_brand_id}`;
      this.logger.debug('AUTO START PROMO BRAND QUEUE DELETED. ID: ' + queueId);
      return await this.promoBrandsQueue.removeJobs(queueId);
    } catch (error) {
      this.errorReport(error, 'general.redis.deleteQueueFail');
    }
  }

  async createAutoFinishPromoBrandQueue(data: CreateAutoFinishPromoBrandDto) {
    try {
      const queueId = `loyalties-promo_brands-finish-${data.promo_brand_id}`;
      this.logger.debug('AUTO FINISH PROMO BRAND CREATED. ID: ' + queueId);
      await this.promoBrandsQueue.add('autoFinishPromoBrand', data, {
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

  async deleteAutoFinishPromoBrandQueue(data: DeleteAutoFinishPromoBrandDto) {
    try {
      const queueId = `loyalties-promo_brands-finish-${data.promo_brand_id}`;
      this.logger.debug(
        'AUTO FINISH PROMO BRAND QUEUE DELETED. ID: ' + queueId,
      );
      return await this.promoBrandsQueue.removeJobs(queueId);
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
