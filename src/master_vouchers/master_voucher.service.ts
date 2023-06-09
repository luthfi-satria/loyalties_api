import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { ILike } from 'typeorm';
import { CreateMasterVoucherDto } from './dto/master_voucher.dto';
import { MasterVouchersDocument } from './entities/master_voucher.entity';
import { MasterVouchersRepository } from './repository/master_voucher.repository';

@Injectable()
export class MasterVoucherService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly masterVouchersRepository: MasterVouchersRepository,
  ) {}
  private readonly logger = new Logger(MasterVoucherService.name);

  async createMasterVoucher(data: CreateMasterVoucherDto) {
    try {
      return await this.masterVouchersRepository.save(data);
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

  async getMasterVoucherDetail(id) {
    try {
      return await this.masterVouchersRepository.findOneOrFail(id);
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

  async getListMasterVoucher(data) {
    try {
      const page = data.page || 1;
      const limit = data.limit || 10;
      const offset = (page - 1) * limit;

      let qry = {};

      if (data.duration) qry = { ...qry, duration: data.duration };
      if (data.type) qry = { ...qry, type: data.type };
      if (data.order_type) qry = { ...qry, order_type: data.order_type };
      if (data.search) qry = { ...qry, name: ILike(`%${data.search}%`) };

      const [items, count] = await this.masterVouchersRepository.findAndCount({
        take: limit,
        skip: offset,
        where: qry,
        order: {
          created_at: 'DESC',
        },
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

  async getAndValidateMasterVoucherById(
    masterVoucherId: string,
  ): Promise<MasterVouchersDocument> {
    const masterVoucher = await this.getMasterVoucherDetail(
      masterVoucherId,
    ).catch((error) => {
      throw error;
    });
    if (!masterVoucher) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: masterVoucherId,
            property: 'master_voucher_id',
            constraint: [
              this.messageService.get('catalog.general.id_notfound'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    return masterVoucher;
  }
}
