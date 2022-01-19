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
  CreateAutoStartVoucherPackageDto,
  DeleteAutoStartVoucherPackageDto,
  CreateAutoFinishVoucherPackageDto,
  DeleteAutoFinishVoucherPackageDto,
} from '../dto/redis-voucher-package.dto';

@Injectable()
export class RedisVoucherPackageService {
  constructor(
    @InjectQueue('loyalties') private readonly voucherPackagesQueue: Queue,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  private readonly logger = new Logger(RedisVoucherPackageService.name);

  async createAutoStartVoucherPackageQueue(
    data: CreateAutoStartVoucherPackageDto,
  ) {
    try {
      const queueId = `loyalties-voucher-packages-start-${data.voucher_package_id}`;
      this.logger.debug('AUTO START VOUCHER PACKAGE CREATED. ID: ' + queueId);
      await this.voucherPackagesQueue.add('autoStartVoucherPackage', data, {
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

  async deleteAutoStartVoucherPackageQueue(
    data: DeleteAutoStartVoucherPackageDto,
  ) {
    try {
      const queueId = `loyalties-voucher-packages-start-${data.voucher_package_id}`;
      this.logger.debug(
        'AUTO START VOUCHER PACKAGE QUEUE DELETED. ID: ' + queueId,
      );
      return await this.voucherPackagesQueue.removeJobs(queueId);
    } catch (error) {
      this.errorReport(error, 'general.redis.deleteQueueFail');
    }
  }

  async createAutoFinishVoucherPackageQueue(
    data: CreateAutoFinishVoucherPackageDto,
  ) {
    try {
      const queueId = `loyalties-voucher-packages-finish-${data.voucher_package_id}`;
      this.logger.debug('AUTO FINISH VOUCHER PACKAGE CREATED. ID: ' + queueId);
      await this.voucherPackagesQueue.add('autoFinishVoucherPackage', data, {
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

  async deleteAutoFinishVoucherPackageQueue(
    data: DeleteAutoFinishVoucherPackageDto,
  ) {
    try {
      const queueId = `loyalties-voucher-packages-finish-${data.voucher_package_id}`;
      this.logger.debug(
        'AUTO FINISH VOUCHER PACKAGE QUEUE DELETED. ID: ' + queueId,
      );
      return await this.voucherPackagesQueue.removeJobs(queueId);
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
    console.log(this.voucherPackagesQueue.getJobs([]));
  }
}
