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
  CreateAutoExpireVoucherDto,
  DeleteAutoExpireVoucherDto,
} from '../dto/redis-voucher.dto';

@Injectable()
export class RedisVoucherService {
  constructor(
    @InjectQueue('loyalties') private readonly vouchersQueue: Queue,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  private readonly logger = new Logger(RedisVoucherService.name);

  async createAutoExpireVoucherQueue(data: CreateAutoExpireVoucherDto) {
    try {
      const queueId = `loyalties-vouchers-expire-${data.voucher_id}`;
      this.logger.debug('AUTO EXPIRE VOUCHER CREATED. ID: ' + queueId);
      await this.vouchersQueue.add('autoExpireVoucher', data, {
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

  async deleteAutoExpireVoucherQueue(data: DeleteAutoExpireVoucherDto) {
    try {
      const queueId = `loyalties-vouchers-expire-${data.voucher_id}`;
      this.logger.debug('AUTO EXPIRE VOUCHER QUEUE DELETED. ID: ' + queueId);
      return await this.vouchersQueue.removeJobs(queueId);
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
    console.log(this.vouchersQueue.getJobs([]));
  }
}
