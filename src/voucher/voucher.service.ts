import { VouchersRepository } from './repository/voucher.repository';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';

import { VoucherDocument } from './entities/voucher.entity';

@Injectable()
export class VoucherService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly vouchersRepository: VouchersRepository,
  ) {}
  private readonly logger = new Logger(VoucherService.name);

  // CRUD

  async createVoucherBulk(data: VoucherDocument[]) {
    try {
      await this.vouchersRepository
        .createQueryBuilder()
        .insert()
        .values(data)
        .execute();
      //   return createdVoucher;
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('general.create.fail'),
              error.message,
            ],
          },
          'Bad Request',
        ),
      );
    }
  }
}
