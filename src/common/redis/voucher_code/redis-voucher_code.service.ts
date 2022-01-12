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
  CreateAutoStartVoucherCodeDto,
  DeleteAutoStartVoucherCodeDto,
  CreateAutoFinishVoucherCodeDto,
  DeleteAutoFinishVoucherCodeDto,
} from '../dto/redis-voucher-code.dto';

@Injectable()
export class RedisVoucherCodeService {
  constructor(
    @InjectQueue('loyalties') private readonly voucherCodesQueue: Queue,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  private readonly logger = new Logger(RedisVoucherCodeService.name);

  async createAutoStartVoucherCodeQueue(data: CreateAutoStartVoucherCodeDto) {
    try {
      const queueId = `loyalties-voucher_codes-start-${data.voucher_code_id}`;
      this.logger.debug('AUTO START VOUCHER CODE CREATED. ID: ' + queueId);
      await this.voucherCodesQueue.add('autoStartVoucherCode', data, {
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

  async deleteAutoStartVoucherCodeQueue(data: DeleteAutoStartVoucherCodeDto) {
    try {
      const queueId = `loyalties-voucher_codes-start-${data.voucher_code_id}`;
      this.logger.debug(
        'AUTO START VOUCHER CODE QUEUE DELETED. ID: ' + queueId,
      );
      return await this.voucherCodesQueue.removeJobs(queueId);
    } catch (error) {
      this.errorReport(error, 'general.redis.deleteQueueFail');
    }
  }

  async createAutoFinishVoucherCodeQueue(data: CreateAutoFinishVoucherCodeDto) {
    try {
      const queueId = `loyalties-voucher_codes-finish-${data.voucher_code_id}`;
      this.logger.debug('AUTO FINISH VOUCHER CODE CREATED. ID: ' + queueId);
      await this.voucherCodesQueue.add('autoFinishVoucherCode', data, {
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

  async deleteAutoFinishVoucherCodeQueue(data: DeleteAutoFinishVoucherCodeDto) {
    try {
      const queueId = `loyalties-voucher_codes-finish-${data.voucher_code_id}`;
      this.logger.debug(
        'AUTO FINISH VOUCHER CODE QUEUE DELETED. ID: ' + queueId,
      );
      return await this.voucherCodesQueue.removeJobs(queueId);
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
    console.log(this.voucherCodesQueue.getJobs([]));
  }
}
