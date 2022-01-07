import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Like } from 'typeorm';
import { CreateVoucherDto } from './dto/voucher.dto';
import { VouchersRepository } from './repository/voucher.repository';

@Injectable()
export class VoucherService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly vouchersRepository: VouchersRepository,
  ) {}
  private readonly logger = new Logger(VoucherService.name);

  async createVoucher(data: CreateVoucherDto) {
    try {
      return await this.vouchersRepository.save(data);
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

  // restart

  async getVoucherDetail(id) {
    try {
      return await this.vouchersRepository.findOneOrFail(id);
    } catch (error) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('general.list.fail'),
              error.message,
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  async getListVoucher(data) {
    try {
      const page = data.page || 1;
      const limit = data.limit || 10;
      const offset = (page - 1) * limit;

      let qry = {};

      if (data.duration) qry = { ...qry, duration: data.duration };
      if (data.type) qry = { ...qry, type: data.type };
      if (data.order_type) qry = { ...qry, order_type: data.order_type };
      if (data.search) qry = { ...qry, name: Like(`%${data.search}%`) };

      const [items, count] = await this.vouchersRepository.findAndCount({
        take: limit,
        skip: offset,
        where: qry,
      });

      const listItems = {
        current_page: page,
        total_item: count,
        limit: limit,
        items: items,
      };

      return listItems;
    } catch (error) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('general.list.fail'),
              error.message,
            ],
          },
          'Bad Request',
        ),
      );
    }
  }
}
