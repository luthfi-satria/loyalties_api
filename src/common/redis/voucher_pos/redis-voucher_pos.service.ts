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
  CreateAutoStartVoucherPosDto,
  DeleteAutoStartVoucherPosDto,
  CreateAutoFinishVoucherPosDto,
  DeleteAutoFinishVoucherPosDto,
} from '../dto/redis-voucher-pos.dto';

@Injectable()
export class RedisVoucherPosService {
  constructor(
    @InjectQueue('loyalties') private readonly voucherPosQueue: Queue,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  private readonly logger = new Logger(RedisVoucherPosService.name);

  async createAutoStartVoucherPosQueue(data: CreateAutoStartVoucherPosDto) {
    try {
      const queueId = `loyalties-voucher_pos-start-${data.voucher_pos_id}`;
      this.logger.debug('AUTO START VOUCHER POS CREATED. ID: ' + queueId);
      await this.voucherPosQueue.add('autoStartVoucherPos', data, {
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

  async deleteAutoStartVoucherPosQueue(data: DeleteAutoStartVoucherPosDto) {
    try {
      const queueId = `loyalties-voucher_pos-start-${data.voucher_pos_id}`;
      this.logger.debug('AUTO START VOUCHER POS QUEUE DELETED. ID: ' + queueId);
      return await this.voucherPosQueue.removeJobs(queueId);
    } catch (error) {
      this.errorReport(error, 'general.redis.deleteQueueFail');
    }
  }

  async createAutoFinishVoucherPosQueue(data: CreateAutoFinishVoucherPosDto) {
    try {
      const queueId = `loyalties-voucher_pos-finish-${data.voucher_pos_id}`;
      this.logger.debug('AUTO FINISH VOUCHER POS CREATED. ID: ' + queueId);
      await this.voucherPosQueue.add('autoFinishVoucherPos', data, {
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

  async deleteAutoFinishVoucherPosQueue(data: DeleteAutoFinishVoucherPosDto) {
    try {
      const queueId = `loyalties-voucher_pos-finish-${data.voucher_pos_id}`;
      this.logger.debug(
        'AUTO FINISH VOUCHER POS QUEUE DELETED. ID: ' + queueId,
      );
      return await this.voucherPosQueue.removeJobs(queueId);
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

  checkJobs() {
    console.log(this.voucherPosQueue.getJobs([]));
  }
}
