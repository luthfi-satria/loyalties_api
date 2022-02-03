import { OrderService } from 'src/common/order/order.service';
import { RedisVoucherService } from './../common/redis/voucher/redis-voucher.service';
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
  TypeVoucherEnum,
  TargetVoucherEnum,
} from './entities/voucher.entity';
import moment from 'moment';
import {
  StatusVoucherCodeGroup,
  TargetGroup,
} from 'src/voucher_code/entities/voucher_code.entity';
import {
  GetActiveTargetVouchersDto,
  UpdateVoucherStatusExpireDto,
} from './dto/get-vouchers.dto';
import { Any } from 'typeorm';
import { VoucherCodeService } from 'src/voucher_code/voucher_code.service';
import { MasterVoucherVoucherCodeRepository } from 'src/master_voucher_voucher_code/repository/master_voucher_voucher_code.repository';
import { FetchMasterVoucherVoucherCodesDto } from 'src/master_voucher_voucher_code/dto/get_master_voucher_voucher_code.dto';
import { MasterVoucherVoucherCodeDocument } from 'src/master_voucher_voucher_code/entities/master_voucher_voucher_code.entity';
import { RMessage } from 'src/response/response.interface';
import { VoucherPackagesMasterVouchersRepository } from 'src/voucher-packages/repository/voucher_package._master_voucher.repository';
import { DateTimeUtils } from 'src/utils/date-time-utils';
import { CreateAutoExpireVoucherDto } from 'src/common/redis/dto/redis-voucher.dto';
import { GetCustomerTargetLoyaltiesDto } from 'src/common/order/dto/get-customer-target-loyalty.dto';

@Injectable()
export class VoucherService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly vouchersRepository: VouchersRepository,
    private readonly voucherCodesRepository: VoucherCodesRepository,
    private readonly voucherCodeService: VoucherCodeService,
    private readonly masterVoucherVoucherCodeRepository: MasterVoucherVoucherCodeRepository,
    private readonly voucherPackagesMasterVouchersRepository: VoucherPackagesMasterVouchersRepository,
    private readonly redisVoucherService: RedisVoucherService,
    private readonly orderService: OrderService,
  ) {}
  private readonly logger = new Logger(VoucherService.name);

  // CRUD

  async createVoucherBulk(data: VoucherDocument[]) {
    try {
      return await this.vouchersRepository
        .createQueryBuilder()
        .insert()
        .values(data)
        .orUpdate(['date_start', 'date_end', 'customer_id', 'status'], ['id'])
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

  async getActiveTargetVouchers(
    data: GetActiveTargetVouchersDto,
  ): Promise<VoucherDocument[]> {
    try {
      const targetList = ['ALL'];
      if (data.target) {
        targetList.push(data.target);
        return this.vouchersRepository.find({
          where: {
            customer_id: data.customer_id,
            status: 'ACTIVE',
            target: Any(targetList),
          },
        });
      } else {
        return this.vouchersRepository.find({
          where: {
            customer_id: data.customer_id,
            status: 'ACTIVE',
          },
        });
      }
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

  errorGenerator(value: string, property: string, constraint: string | any[]) {
    if (typeof constraint == 'string') {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value,
            property,
            constraint: [this.messageService.get(constraint)],
          },
          'Bad Request',
        ),
      );
    } else {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value,
            property,
            constraint: constraint,
          },
          'Bad Request',
        ),
      );
    }
  }

  async getCostumerTargetLoyalties(
    data: GetCustomerTargetLoyaltiesDto,
  ): Promise<string> {
    try {
      if (!data.created_at || !data.customer_id) {
        return null;
      }

      const { data: response } =
        await this.orderService.getCostumerTargetLoyalties(data);

      return response?.target;
    } catch (error) {
      this.errorGenerator('', 'target', 'general.order.getTargetFail');
    }
  }

  async checkValidCode(code) {
    const voucherCode = await this.voucherCodesRepository.findOne({
      where: { code: code },
    });
    const voucher = await this.vouchersRepository.findOne({
      where: { code: code },
    });

    return voucherCode || voucher ? true : false;
  }

  async redeemVoucher(data, customer_id): Promise<any[]> {
    // NOT AUTO GENERATE
    const validCode = await this.checkValidCode(data.code);
    if (!validCode) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: data.code,
            property: 'code',
            constraint: [
              this.messageService.get('general.voucher.voucherCodeInvalid'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    console.log(data);

    const customer = data.customer || null;
    console.log(customer);

    const target = customer
      ? await this.getCostumerTargetLoyalties({
          customer_id: customer.id,
          created_at: customer.created_at,
        })
      : null;
    console.log(target);

    let voucherCode = await this.voucherCodesRepository.findOne({
      where: {
        code: data.code,
        status: StatusVoucherCodeGroup.ACTIVE,
        is_prepopulated: false,
        // target: target,
      },
      relations: [
        'master_voucher_voucher_code',
        'vouchers',
        'master_voucher_voucher_code.master_voucher',
      ],
    });

    if (voucherCode && voucherCode.target != TargetGroup.ALL) {
      voucherCode = await this.voucherCodesRepository.findOne({
        where: {
          code: data.code,
          status: StatusVoucherCodeGroup.ACTIVE,
          is_prepopulated: false,
          target: target,
        },
        relations: [
          'master_voucher_voucher_code',
          'vouchers',
          'master_voucher_voucher_code.master_voucher',
        ],
      });
    }

    let voucherCodeId = voucherCode?.id;

    //=> validasi voucher masih ada quota
    if (!voucherCode) {
      await this.validateVoucherQuotaNonGenerate(data.code);
    }

    //=> Validasi voucher belum digunakan oleh customer
    this.validateVoucherUsed(voucherCode?.vouchers, customer_id);

    if (voucherCode) {
      if (voucherCode.quota) {
        let vouchersTotal = 0;
        const count = await this.vouchersRepository.count({
          where: {
            voucher_code_id: voucherCode.id,
            status: StatusVoucherEnum.ACTIVE,
          },
        });

        const mvvcs = await this.fetchMasterVoucherVoucherCodes({
          loyaltiesVoucherCodeId: voucherCodeId,
          loyaltiesMasterVoucherId: null,
        });

        // if (count < voucherCode.quota) {
        const postVoucherDatas = [];
        // for (let i = 0; i < voucherCode.master_vouchers.length; i++) {
        for (let i = 0; i < mvvcs.length; i++) {
          // const master_voucher = voucherCode.master_vouchers[i];
          const master_voucher = mvvcs[i].master_voucher;
          const quantity = mvvcs[i].quantity;
          const date_start = new Date();
          const days = this.getDurationInt(master_voucher.duration);
          const date_end = moment(date_start).add(days, 'days');

          for (let y = 0; y < quantity; y++) {
            vouchersTotal += 1;
            const postVoucherData = {
              voucher_code_id: voucherCode.id,
              master_voucher_id: master_voucher.id,
              customer_id,
              code:
                voucherCode.code +
                Math.floor(Math.random() * (100 - 1 + 1)) +
                1,
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
          // const postVoucherData = {
          //   voucher_code_id: voucherCode.id,
          //   customer_id,
          //   code:
          //     voucherCode.code + Math.floor(Math.random() * (100 - 1 + 1)) + 1,
          //   type: master_voucher.type,
          //   order_type: master_voucher.order_type,
          //   target: voucherCode.target,
          //   status: StatusVoucherEnum.ACTIVE,
          //   date_start,
          //   date_end,
          //   minimum_transaction: master_voucher.minimum_transaction,
          //   discount_type: master_voucher.discount_type,
          //   discount_value: master_voucher.discount_value,
          //   discount_maximum: master_voucher.discount_maximum,
          //   is_combinable: master_voucher.is_combinable,
          // };
          // postVoucherDatas.push(postVoucherData);
        }
        const createdVouchers = await this.createVoucherBulk(postVoucherDatas);
        for (const identifier of createdVouchers.identifiers) {
          const createdVoucher = await this.vouchersRepository.findOne({
            where: { id: identifier.id },
          });

          await this.createVoucherQueue(createdVoucher);
        }

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

        //=> update quota jika habis ketika di redeem
        if (
          count + vouchersTotal >= voucherCode.quota * vouchersTotal &&
          vouchersTotal &&
          voucherCode.quota
        ) {
          await this.updateVoucherCodeEmpty(voucherCode.id);
        }
      } else {
        const postVoucherDatas = [];
        for (
          let i = 0;
          i < voucherCode.master_voucher_voucher_code.length;
          i++
        ) {
          const master_voucher_voucher_code =
            voucherCode.master_voucher_voucher_code[i];

          const master_voucher = master_voucher_voucher_code.master_voucher;
          const date_start = new Date();
          const days = this.getDurationInt(master_voucher.duration);
          const date_end = moment(date_start).add(days, 'days');

          const quantity = master_voucher_voucher_code.quantity;
          for (let y = 0; y < quantity; y++) {
            const postVoucherData = {
              voucher_code_id: voucherCode.id,
              master_voucher_id: master_voucher.id,
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
        await this.createVoucherBulk(postVoucherDatas);
      }
    } else {
      // AUTO GENERATE
      let vouchers = await this.vouchersRepository.find({
        where: {
          code: data.code,
          customer_id: null,
          status: StatusVoucherEnum.CREATED,
        },
      });

      if (vouchers.length > 0 && vouchers[0]?.target != TargetVoucherEnum.ALL) {
        vouchers = await this.vouchersRepository.find({
          where: { code: data.code, customer_id: null, target: target },
        });
      }

      if (vouchers.length > 0) {
        // for (const voucher of vouchers) {
        // voucherCodeId = voucher?.voucher_code_id;
        voucherCodeId = vouchers[0]?.voucher_code_id;
        const voucher = vouchers[0];
        voucher.status = StatusVoucherEnum.ACTIVE;
        voucher.customer_id = customer_id;

        voucherCode = await this.voucherCodesRepository.findOne({
          where: {
            id: voucher.voucher_code_id,
            status: StatusVoucherCodeGroup.ACTIVE,
          },
        });

        if (!voucherCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              {
                value: data.code,
                property: 'code',
                constraint: [
                  this.messageService.get('general.voucher.voucherCodeInvalid'),
                ],
              },
              'Bad Request',
            ),
          );
        }

        const mvvcs = await this.fetchMasterVoucherVoucherCodes({
          loyaltiesVoucherCodeId: voucherCodeId,
          loyaltiesMasterVoucherId: voucher.master_voucher_id,
        });

        for (let i = 0; i < mvvcs.length; i++) {
          const master_voucher_voucher_code = mvvcs[i];
          const master_voucher = master_voucher_voucher_code.master_voucher;
          const date_start = new Date();
          const days = this.getDurationInt(master_voucher.duration);
          const date_end = moment(date_start).add(days, 'days');
          voucher.date_end = date_end.toDate();
          voucher.date_start = date_start;
        }
        const createdVoucher = await this.vouchersRepository.save(voucher);
        await this.createVoucherQueue(createdVoucher);

        //=> update quota jika habis ketika di redeem
        if (voucherCode) {
          const countVouchersLeft = await this.vouchersRepository.find({
            where: { voucher_code_id: voucherCode.id, customer_id: null },
          });

          if (!countVouchersLeft) {
            await this.updateVoucherCodeEmpty(voucherCode.id);
          }
        }
        // }
      } else {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: data.code,
              property: 'code',
              constraint: [
                this.messageService.get('general.voucher.quotaReached'),
              ],
            },
            'Bad Request',
          ),
        );
      }
    }

    //=> Response api
    return this.fetchMasterVoucherVoucherCodes({
      loyaltiesVoucherCodeId: voucherCodeId,
      loyaltiesMasterVoucherId: null,
    });
  }

  async getMyVouchers(data, customer_id) {
    try {
      const page = data.page || 1;
      const limit = data.limit || 10;
      const offset = (page - 1) * limit;

      // const [items, count] = await this.vouchersRepository.findAndCount({
      //   take: limit,
      //   skip: offset,
      //   where: { customer_id, status: StatusVoucherEnum.ACTIVE },
      // });

      const query = await this.masterVoucherVoucherCodeRepository
        .createQueryBuilder('mvvc')
        .innerJoinAndSelect('mvvc.master_voucher', 'master_voucher')
        .innerJoinAndSelect('mvvc.voucher_code', 'voucher_code')
        .innerJoinAndSelect(
          'voucher_code.vouchers',
          'vouchers',
          'vouchers.customer_id = :customer_id and vouchers.status = :status and vouchers.master_voucher_id = master_voucher.id',
          { customer_id, status: StatusVoucherEnum.ACTIVE },
        )
        .take(limit);

      const [items, count] = await query.skip(offset).getManyAndCount();
      let countPackage = 0;
      let packageVoucher = [];

      const total_page = Math.floor(count / limit) + 1;

      if (page >= total_page) {
        const offset_last_page = (total_page - 1) * limit;
        const count_last_page = await query.skip(offset_last_page).getCount();
        const offsetPackage =
          page > total_page
            ? page - total_page == 1
              ? (limit - count_last_page) * (page - total_page)
              : limit * (page - total_page - 1) + (limit - count_last_page)
            : 0;

        const limitPackage =
          page == total_page ? limit - count_last_page : limit;

        const queryPackage = await this.voucherPackagesMasterVouchersRepository
          .createQueryBuilder('vpmv')
          .innerJoinAndSelect('vpmv.master_voucher', 'master_voucher')
          .innerJoinAndSelect('vpmv.voucher_package', 'voucher_package')
          .innerJoinAndSelect(
            'voucher_package.vouchers',
            'vouchers',
            'vouchers.customer_id = :customer_id and vouchers.status = :status and vouchers.master_voucher_id = master_voucher.id',
            { customer_id, status: StatusVoucherEnum.ACTIVE },
          )
          .take(limitPackage)
          .skip(offsetPackage);

        packageVoucher = await queryPackage.getMany();
        countPackage = await queryPackage.getCount();
      }

      let arr = [];

      arr = arr.concat(items);
      arr = arr.concat(packageVoucher);

      const listItems = {
        current_page: parseInt(page),
        total_item: count + countPackage,
        limit: parseInt(limit),
        items: arr,
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
    deliveryFee: number,
  ): number {
    let discount = null;
    if (voucher.type == TypeVoucherEnum.SHOPPING_COST) {
      discount =
        voucher.discount_type == DiscountTypeVoucherEnum.PRICE
          ? voucher.discount_value
          : Math.ceil((cartTotal * voucher.discount_value) / 100);
    } else if (voucher.type == TypeVoucherEnum.DELIVERY_COST) {
      discount =
        voucher.discount_type == DiscountTypeVoucherEnum.PRICE
          ? voucher.discount_value
          : Math.ceil((deliveryFee * voucher.discount_value) / 100);
    }
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

  validateVoucherUsed(vouchers: VoucherDocument[], customerId: string) {
    //=> Validasi voucher belum digunakan oleh customer
    const userVoucher = vouchers?.find((voc) => {
      return voc.customer_id == customerId;
    });
    if (userVoucher) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: customerId,
            property: 'customer_id',
            constraint: [this.messageService.get('general.voucher.redeemUsed')],
          },
          'Bad Request',
        ),
      );
    }
  }

  async validateVoucherQuotaNonGenerate(code: string) {
    const validateVoucherCode = await this.voucherCodesRepository.findOne({
      where: { code },
    });

    if (
      validateVoucherCode?.status == 'STOPPED' &&
      validateVoucherCode?.cancellation_reason == 'Kuota telah habis'
    ) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: code,
            property: 'code',
            constraint: [
              this.messageService.get('general.voucher.quotaReached'),
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  async updateVoucherCodeEmpty(voucherCodeId: string) {
    await this.voucherCodeService.stopVoucherCode({
      cancellation_reason: 'Kuota telah habis',
      id: voucherCodeId,
      isBypassValidation: true,
    });
  }

  async fetchMasterVoucherVoucherCodes(
    data: FetchMasterVoucherVoucherCodesDto,
  ): Promise<MasterVoucherVoucherCodeDocument[]> {
    try {
      const loyaltiesMasterVoucherId = data.loyaltiesMasterVoucherId || null;
      const loyaltiesVoucherCodeId = data.loyaltiesVoucherCodeId || null;

      this.logger.debug('test');

      const query = this.masterVoucherVoucherCodeRepository
        .createQueryBuilder('tab')
        .leftJoinAndSelect('tab.master_voucher', 'master_voucher');

      if (loyaltiesMasterVoucherId) {
        query.andWhere(
          'tab.loyaltiesMasterVoucherId = :loyaltiesMasterVoucherId',
          {
            loyaltiesMasterVoucherId,
          },
        );
      }

      if (loyaltiesVoucherCodeId) {
        query.andWhere('tab.loyaltiesVoucherCodeId = :loyaltiesVoucherCodeId', {
          loyaltiesVoucherCodeId,
        });
      }

      return query.getMany();
    } catch (error) {
      console.error(error);
    }
  }

  async useVoucher(data: any) {
    try {
      const voucherIds = data.voucher_ids || null;
      const customerId = data.customer_id || null;

      if (voucherIds?.length) {
        await this.vouchersRepository
          .createQueryBuilder('q')
          .update({ status: StatusVoucherEnum.USED })
          .where({
            id: Any(voucherIds),
            customer_id: customerId,
            status: StatusVoucherEnum.ACTIVE,
          })
          .execute()
          .catch((error) => {
            this.logger.error(error.message);
            console.error(error);
            throw new BadRequestException(
              this.responseService.error(
                HttpStatus.BAD_REQUEST,
                {
                  value: '',
                  property: '',
                  constraint: [this.messageService.get('general.update.fail')],
                },
                'Bad Request',
              ),
            );
          });
      }
    } catch (error) {
      if (error.message == 'Bad Request Exception') {
        throw error;
      } else {
        const errors: RMessage = {
          value: '',
          property: '',
          constraint: [
            this.messageService.get('general.update.fail'),
            error.message,
          ],
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

  async cancelVoucher(data: any) {
    try {
      const voucherIds = data.voucher_ids || null;
      const customerId = data.customer_id || null;

      if (voucherIds?.length) {
        await this.vouchersRepository
          .createQueryBuilder('q')
          .update({ status: StatusVoucherEnum.ACTIVE })
          .where({
            id: Any(voucherIds),
            customer_id: customerId,
            status: StatusVoucherEnum.USED,
          })
          .execute()
          .catch((error) => {
            this.logger.error(error.message);
            console.error(error);
            throw new BadRequestException(
              this.responseService.error(
                HttpStatus.BAD_REQUEST,
                {
                  value: '',
                  property: '',
                  constraint: [this.messageService.get('general.update.fail')],
                },
                'Bad Request',
              ),
            );
          });
      }
    } catch (error) {
      if (error.message == 'Bad Request Exception') {
        throw error;
      } else {
        const errors: RMessage = {
          value: '',
          property: '',
          constraint: [
            this.messageService.get('general.update.fail'),
            error.message,
          ],
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

  async createVoucherQueue(createdVoucher: VoucherDocument) {
    const payloadExpire: CreateAutoExpireVoucherDto = {
      voucher_id: createdVoucher.id,
      delay: DateTimeUtils.nowToDatetimeMilis(createdVoucher.date_end),
    };
    await this.redisVoucherService.createAutoExpireVoucherQueue(payloadExpire);
  }

  async updateVoucherStatusExpired(
    data: UpdateVoucherStatusExpireDto,
  ): Promise<VoucherDocument> {
    try {
      const findVoucher = await this.vouchersRepository.findOneOrFail({
        where: { id: data.voucher_id },
      });

      if (findVoucher.status !== StatusVoucherEnum.ACTIVE) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: 'status',
              property: 'status',
              constraint: [
                this.messageService.get('general.general.statusNotAllowed'),
                '',
              ],
            },
            'Bad Request',
          ),
        );
      }

      findVoucher.status = StatusVoucherEnum.EXPIRED;

      const updatedVoucher = await this.vouchersRepository.save(findVoucher);
      return updatedVoucher;
    } catch (error) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: 'status',
            property: 'status',
            constraint: [
              this.messageService.get('general.update.fail'),
              error.message,
            ],
          },
          'Bad Request',
        ),
      );
    }
  }
}
