import { VoucherCodesRepository } from './../voucher_code/repository/voucher_code.repository';
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
  StatusVoucherEnum,
  VoucherDocument,
} from './entities/voucher.entity';
import moment from 'moment';
import { StatusVoucherCodeGroup } from 'src/voucher_code/entities/voucher_code.entity';

@Injectable()
export class VoucherService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly vouchersRepository: VouchersRepository,
    private readonly voucherCodesRepository: VoucherCodesRepository,
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

  getDurationInt(duration) {
    let days = 0;
    switch (duration) {
      case '1DAY':
        days = 1;
        break;

      case '3DAYS':
        days = 3;
        break;

      case '7DAYS':
        days = 7;
        break;

      case '10DAYS':
        days = 10;
        break;

      case '14DAYS':
        days = 14;
        break;

      case '30DAYS':
        days = 30;
        break;
    }
    return days;
  }

  async redeemVoucher(data, customer_id) {
    // NOT AUTO GENERATE
    let voucherCode = await this.voucherCodesRepository.findOne({
      where: { code: data.code, status: StatusVoucherCodeGroup.ACTIVE },
      relations: ['master_vouchers'],
    });

    if (voucherCode) {
      if (voucherCode.quota) {
        const count = await this.vouchersRepository.count({
          where: {
            voucher_code_id: voucherCode.id,
            status: StatusVoucherEnum.ACTIVE,
          },
        });
        console.log(voucherCode);

        // if (count < voucherCode.quota) {
        const postVoucherDatas = [];
        for (let i = 0; i < voucherCode.master_vouchers.length; i++) {
          const master_voucher = voucherCode.master_vouchers[i];
          const date_start = new Date();
          const days = this.getDurationInt(master_voucher.duration);
          const date_end = moment(date_start).add(days, 'days');
          const postVoucherData = {
            voucher_code_id: voucherCode.id,
            customer_id,
            code:
              voucherCode.code + Math.floor(Math.random() * (100 - 1 + 1)) + 1,
            type: master_voucher.type,
            order_type: master_voucher.order_type,
            target: voucherCode.target,
            status: StatusVoucherEnum.ACTIVE,
            date_start,
            date_end,
            minimum_transaction: master_voucher.minimum_transaction,
            discount_type: master_voucher.discount_type,
            discount_value: master_voucher.discount_value,
            discount_maximum: master_voucher.discount_maximum,
            is_combinable: master_voucher.is_combinable,
          };
          postVoucherDatas.push(postVoucherData);
        }
        await this.createVoucherBulk(postVoucherDatas);
        // } else {
        //   throw new BadRequestException(
        //     this.responseService.error(
        //       HttpStatus.BAD_REQUEST,
        //       {
        //         value: `${voucherCode.quota}`,
        //         property: 'quota',
        //         constraint: [
        //           this.messageService.get('general.create.fail'),
        //           'quota full',
        //         ],
        //       },
        //       'Bad Request',
        //     ),
        //   );
        // }
      } else {
        const postVoucherDatas = [];
        for (let i = 0; i < voucherCode.master_vouchers.length; i++) {
          const master_voucher = voucherCode.master_vouchers[i];
          const date_start = new Date();
          const days = this.getDurationInt(master_voucher.duration);
          const date_end = moment(date_start).add(days, 'days');
          const postVoucherData = {
            voucher_code_id: voucherCode.id,
            customer_id,
            code: voucherCode.code,
            type: master_voucher.type,
            order_type: master_voucher.order_type,
            target: voucherCode.target,
            status: StatusVoucherEnum.ACTIVE,
            date_start,
            date_end,
            minimum_transaction: master_voucher.minimum_transaction,
            discount_type: master_voucher.discount_type,
            discount_value: master_voucher.discount_value,
            discount_maximum: master_voucher.discount_maximum,
            is_combinable: master_voucher.is_combinable,
          };
          postVoucherDatas.push(postVoucherData);
        }
      }
    } else {
      // AUTO GENERATE
      const vouchers = await this.vouchersRepository.find({
        where: { code: data.code, customer_id: null },
      });

      if (vouchers.length > 0) {
        const voucher = vouchers[0];
        voucher.status = StatusVoucherEnum.ACTIVE;
        const date_start = new Date();
        const days = this.getDurationInt(master_voucher.duration);

        // voucherCode = await this.voucherCodesRepository.findOne({
        //   where: { id: voucher.voucher_code_id },
        //   relations: ['master_vouchers'],
        // });
        // const postVoucherDatas = [];
        // for (let i = 0; i < voucherCode.master_vouchers.length; i++) {
        //   const master_voucher = voucherCode.master_vouchers[i];
        //   const date_start = new Date();
        //   const days = this.getDurationInt(master_voucher.duration);
        //   const date_end = moment(date_start).add(days, 'days');
        //   const postVoucherData = {
        //     voucher_code_id: voucherCode.id,
        //     customer_id,
        //     code: voucherCode.code,
        //     type: master_voucher.type,
        //     order_type: master_voucher.order_type,
        //     target: voucherCode.target,
        //     status: StatusVoucherEnum.ACTIVE,
        //     date_start,
        //     date_end,
        //     minimum_transaction: master_voucher.minimum_transaction,
        //     discount_type: master_voucher.discount_type,
        //     discount_value: master_voucher.discount_value,
        //     discount_maximum: master_voucher.discount_maximum,
        //     is_combinable: master_voucher.is_combinable,
        //   };
        //   postVoucherDatas.push(postVoucherData);
        // }
        // await this.createVoucherBulk(postVoucherDatas);
      } else {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: `${voucherCode.quota}`,
              property: 'quota',
              constraint: [
                this.messageService.get('general.create.fail'),
                'quota full',
              ],
            },
            'Bad Request',
          ),
        );
      }
    }

    return {};
  }

  async getMyVouchers(data, customer_id) {
    try {
      const page = data.page || 1;
      const limit = data.limit || 10;
      const offset = (page - 1) * limit;

      const [items, count] = await this.vouchersRepository.findAndCount({
        take: limit,
        skip: offset,
        where: { customer_id, status: StatusVoucherEnum.ACTIVE },
      });

      const listItems = {
        current_page: parseInt(page),
        total_item: count,
        limit: parseInt(limit),
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
