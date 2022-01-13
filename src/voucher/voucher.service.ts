import { VouchersRepository } from './repository/voucher.repository';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';

import {
  DiscountTypeVoucherEnum,
  OrderTypeVoucherEnum,
  VoucherDocument,
} from './entities/voucher.entity';

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

  async getVoucherByCustomerId(customerId: string): Promise<VoucherDocument[]> {
    try {
      return this.vouchersRepository.find({
        where: { customer_id: customerId },
      });
    } catch (error) {
      this.logger.log(error);
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

  calculateVoucherDiscount(
    voucher: VoucherDocument,
    cartTotal: number,
  ): number {
    let discount =
      voucher.discount_type == DiscountTypeVoucherEnum.PRICE
        ? voucher.discount_value
        : Math.ceil((cartTotal * voucher.discount_value) / 100);
    if (discount > voucher.discount_maximum && voucher.discount_maximum) {
      discount = voucher.discount_maximum;
    }
    return discount;
  }

  checkUsableVoucher(
    voucher: VoucherDocument,
    totalCart: number,
    orderType: string,
  ): boolean {
    if (
      (!voucher.minimum_transaction ||
        voucher.minimum_transaction <= totalCart) &&
      (voucher.order_type == OrderTypeVoucherEnum.DELIVERY_AND_PICKUP ||
        (voucher.order_type == OrderTypeVoucherEnum.DELIVERY_ONLY &&
          orderType == 'DELIVERY') ||
        (voucher.order_type == OrderTypeVoucherEnum.PICKUP_ONLY &&
          orderType == 'PICKUP'))
    ) {
      return true;
    }
    return false;
  }
}
