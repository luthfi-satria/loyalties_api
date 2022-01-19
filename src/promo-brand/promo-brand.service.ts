import { NatsClient } from '@alexy4744/nestjs-nats-jetstream-transporter';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import moment from 'moment';
import {
  CreateAutoStartPromoBrandDto,
  CreateAutoFinishPromoBrandDto,
} from 'src/common/redis/dto/redis-promo-brand.dto';
import { RedisPromoBrandService } from 'src/common/redis/promo-brand/redis-promo-brand.service';

import {
  EnumPromoBrandDiscountType,
  EnumPromoBrandOrderType,
  EnumPromoBrandStatus,
  EnumPromoBrandType,
  PromoBrandDocument,
} from 'src/database/entities/promo-brand.entity';
import { PromoBrandRepository } from 'src/database/repository/promo-brand.repository';
import { GetRecommendedPromosDto } from 'src/internal/dto/get-recommended-promos.dto';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { DateTimeUtils } from 'src/utils/date-time-utils';
import { VoucherDocument } from 'src/voucher/entities/voucher.entity';
import { Brackets } from 'typeorm';
import {
  BaseCreatePromoBrandDto,
  DbCreatePromoBrandDto,
} from './dto/create-promo-brand.dto';
import {
  DetailPromoBrandDto,
  ExtendedListPromoBrandDto,
  ListPromoBrandDto,
} from './dto/list-promo-brand.dto';
import {
  CancellPromoBrandDto,
  StopPromoBrandDto,
  UpdatePromoBrandDto,
  UpdatePromoBrandStatusActiveDto,
  UpdatePromoBrandStatusFinishDto,
} from './dto/update-promo-brand.dto';

@Injectable()
export class PromoBrandService {
  constructor(
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly promoBrandRepository: PromoBrandRepository,
    private readonly redisPromoBrandService: RedisPromoBrandService, // private readonly voucherService: VoucherService,
  ) {}

  private readonly logger = new Logger(PromoBrandService.name);

  private readonly client = new NatsClient({
    connection: {
      servers: process.env.NATS_SERVERS.split(','),
    },
  });

  async createPromoBrand(data: BaseCreatePromoBrandDto) {
    try {
      this.validatePromoData(data);

      const gmt_offset = '7';
      const timeStart = new Date(`${data.date_start} +${gmt_offset}`);
      const timeEnd = new Date(`${data.date_end} +${gmt_offset}`);

      this.checkPromoInPast(timeEnd);

      const now = new Date();

      const promoStatus =
        timeStart <= now
          ? EnumPromoBrandStatus.ACTIVE
          : EnumPromoBrandStatus.SCHEDULED;

      data.date_start = timeStart;
      data.date_end = timeEnd;
      data.status = promoStatus;

      const createdPromo = await this.insertPromoBrandToDb(data);

      await this.createPromoBrandQueue(promoStatus, createdPromo);

      if (promoStatus == EnumPromoBrandStatus.ACTIVE) {
        await this.broadcastPromoBrand(createdPromo.id, 'promo_brand.active');
      }

      return createdPromo;
    } catch (error) {
      this.errorReport(error, 'general.create.fail');
    }
  }

  async insertPromoBrandToDb(
    data: DbCreatePromoBrandDto,
  ): Promise<PromoBrandDocument> {
    const createPromo = this.promoBrandRepository.create(data);
    return this.promoBrandRepository.save(createPromo).catch((error) => {
      const errors: RMessage = {
        value: error.value,
        property: error.property,
        constraint: [
          this.messageService.get('general.create.fail'),
          error.message,
          error.detail,
        ],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    });
  }

  async listPromoBrand(data: ListPromoBrandDto): Promise<{
    total_item: number;
    limit: number;
    current_page: number;
    items: any[];
  }> {
    try {
      return this.fetchPromoBrandsFromDb({
        promo_brand_id: null,
        limit: data.limit,
        page: data.page,
        target: data.target,
        type: data.type,
        periode_start: data.periode_start,
        periode_end: data.periode_end,
        status: data.status,
        order_type: data.order_type,
        cart_total: null,
        target_list: null,
        order_type_list: null,
        merchant_id: data.merchant_id,
      });
    } catch (error) {
      this.errorReport(error, 'general.list.fail');
    }
  }

  async detailPromoBrand(data: DetailPromoBrandDto): Promise<any> {
    try {
      const { items } = await this.fetchPromoBrandsFromDb({
        promo_brand_id: data.promo_brand_id,
        limit: null,
        page: null,
        target: null,
        type: null,
        periode_start: null,
        periode_end: null,
        status: null,
        order_type: null,
        cart_total: null,
        target_list: null,
        order_type_list: null,
        merchant_id: data.merchant_id,
      });
      const result = items?.[0];
      if (!result) {
        this.errorGenerator(
          data.promo_brand_id,
          'promo_brand_id',
          'general.general.dataNotFound',
        );
      }
      return result;
    } catch (error) {
      this.errorReport(error, 'general.general.dataNotFound');
    }
  }

  async fetchPromoBrandsFromDb(data: ExtendedListPromoBrandDto): Promise<{
    total_item: number;
    limit: number;
    current_page: number;
    items: any[];
  }> {
    try {
      const currentPage = data.page || 1;
      const perPage = data.limit || 10;
      const target = data.target || null;
      const type = data.type || null;
      const dateStart = data.periode_start || null;
      const dateEnd = data.periode_end || null;
      const status = data.status || null;
      const orderType = data.order_type || null;
      const promoBrandId = data.promo_brand_id || null;
      const merchantId = data.merchant_id || null;

      const cartTotal = data.cart_total || null;
      const targetList = data.target_list?.length ? data.target_list : null;
      const orderTypeList = data.order_type_list?.length
        ? data.order_type_list
        : null;

      const query = this.promoBrandRepository.createQueryBuilder('pbrand');

      if (promoBrandId) {
        query.where('pbrand.id = :promoBrandId', { promoBrandId });
      }

      if (merchantId) {
        query.andWhere('pbrand.merchant_id = :merchantId', { merchantId });
      }

      if (target) {
        query.andWhere('pbrand.target = :target', {
          target,
        });
      }

      if (type) {
        query.andWhere('pbrand.type = :type', {
          type,
        });
      }

      if (dateStart) {
        query.andWhere('pbrand.date_start >= :dateStart', {
          dateStart,
        });
      }

      if (dateEnd) {
        query.andWhere('pbrand.date_end <= :dateEnd', {
          dateEnd,
        });
      }

      if (status) {
        query.andWhere('pbrand.status = :status', {
          status,
        });
      }

      if (orderType) {
        query.andWhere('pbrand.order_type = :orderType', {
          orderType,
        });
      }

      if (cartTotal) {
        query.andWhere(
          new Brackets((qb) => {
            qb.where('pbrand.minimum_transaction <= :cartTotal', {
              cartTotal: cartTotal,
            })
              .orWhere('pbrand.minimum_transaction IS NULL')
              .orWhere('pbrand.minimum_transaction = 0');
          }),
        );
      }

      if (targetList) {
        query.andWhere('pbrand.target in (:...targetList)', { targetList });
      }

      if (orderTypeList) {
        query.andWhere('pbrand.order_type in (:...orderTypeList)', {
          orderTypeList,
        });
      }

      query
        .orderBy('pbrand.created_at', 'DESC')
        .skip((currentPage - 1) * perPage)
        .take(perPage);

      const [items, count] = await query.getManyAndCount();

      return {
        total_item: count,
        limit: perPage,
        current_page: currentPage,
        items: items,
      };
    } catch (error) {
      this.errorReport(error, 'general.list.fail');
    }
  }

  async updatePromoBrand(data: UpdatePromoBrandDto) {
    try {
      this.validatePromoData(data);

      const findPromoBrand = await this.findOneOrFail(data.id);
      if (
        findPromoBrand.status === EnumPromoBrandStatus.CANCELLED ||
        findPromoBrand.status === EnumPromoBrandStatus.STOPPED
      ) {
        this.errorGenerator(
          findPromoBrand.status,
          'status',
          'general.general.statusNotAllowed',
        );
      }

      const gmt_offset = '7';
      const timeStart = new Date(`${data.date_start} +${gmt_offset}`);
      const timeEnd = new Date(`${data.date_end} +${gmt_offset}`);

      this.checkPromoInPast(timeEnd);

      const now = new Date();

      const promoBrandStatus =
        timeStart <= now
          ? EnumPromoBrandStatus.ACTIVE
          : EnumPromoBrandStatus.SCHEDULED;

      findPromoBrand.date_start = timeStart;
      findPromoBrand.date_end = timeEnd;
      findPromoBrand.type = data.type;
      findPromoBrand.status = promoBrandStatus;
      findPromoBrand.order_type = data.order_type;
      findPromoBrand.target = data.target;
      findPromoBrand.minimum_transaction = data.minimum_transaction;
      findPromoBrand.quota = data.quota;
      findPromoBrand.discount_type = data.discount_type;
      findPromoBrand.discount_value = data.discount_value;
      findPromoBrand.is_combinable = data.is_combinable;

      const updatedPromoBrand = await this.insertPromoBrandToDb(findPromoBrand);

      await this.deletePromoBrandQueues(updatedPromoBrand.id);

      await this.createPromoBrandQueue(promoBrandStatus, updatedPromoBrand);

      if (promoBrandStatus == EnumPromoBrandStatus.ACTIVE) {
        await this.broadcastPromoBrand(
          updatedPromoBrand.id,
          'promo_brand.active',
        );
      }

      return updatedPromoBrand;
    } catch (error) {
      this.errorReport(error, 'general.update.fail');
    }
  }

  async cancellPromoBrand(data: CancellPromoBrandDto) {
    try {
      const findPromoBrand = await this.findOneOrFail(data.promo_brand_id);

      if (findPromoBrand.status != EnumPromoBrandStatus.SCHEDULED) {
        this.errorGenerator(
          findPromoBrand.status,
          'status',
          'general.general.statusNotAllowed',
        );
      }

      findPromoBrand.cancellation_reason = data.cancellation_reason;
      findPromoBrand.status = EnumPromoBrandStatus.CANCELLED;

      const updatedPromo = await this.insertPromoBrandToDb(findPromoBrand);

      await this.deletePromoBrandQueues(updatedPromo.id);

      await this.broadcastPromoBrand(updatedPromo.id, 'promo_brand.inactive');

      return updatedPromo;
    } catch (error) {
      this.errorReport(error, 'general.update.fail');
    }
  }

  async stopPromoBrand(data: StopPromoBrandDto) {
    try {
      const findPromoBrand = await this.findOneOrFail(data.promo_brand_id);

      if (findPromoBrand.status != EnumPromoBrandStatus.ACTIVE) {
        this.errorGenerator(
          findPromoBrand.status,
          'status',
          'general.general.statusNotAllowed',
        );
      }

      findPromoBrand.cancellation_reason = data.cancellation_reason;
      findPromoBrand.status = EnumPromoBrandStatus.STOPPED;

      const updatedPromoBrand = await this.insertPromoBrandToDb(findPromoBrand);

      await this.deletePromoBrandQueues(updatedPromoBrand.id);

      await this.broadcastPromoBrand(
        updatedPromoBrand.id,
        'promo_brand.inactive',
      );

      return updatedPromoBrand;
    } catch (error) {
      this.errorReport(error, 'general.update.fail');
    }
  }

  async updatePromoBrandStatusActive(
    data: UpdatePromoBrandStatusActiveDto,
  ): Promise<PromoBrandDocument> {
    try {
      const findPromoBrand = await this.findOneOrFail(data.promo_brand_id);

      if (findPromoBrand.status !== EnumPromoBrandStatus.SCHEDULED) {
        this.errorGenerator(
          findPromoBrand.status,
          'status',
          'general.general.statusNotAllowed',
        );
      }

      findPromoBrand.status = EnumPromoBrandStatus.ACTIVE;

      const updatedPromo = await this.insertPromoBrandToDb(findPromoBrand);

      //broadcast here
      await this.broadcastPromoBrand(updatedPromo.id, 'promo_brand.active');

      return updatedPromo;
    } catch (error) {
      this.errorReport(error, 'general.update.fail');
    }
  }

  async updatePromoBrandStatusFinished(
    data: UpdatePromoBrandStatusFinishDto,
  ): Promise<PromoBrandDocument> {
    try {
      const findPromoBrand = await this.findOneOrFail(data.promo_brand_id);

      if (findPromoBrand.status !== EnumPromoBrandStatus.ACTIVE) {
        this.errorGenerator(
          findPromoBrand.status,
          'status',
          'general.general.statusNotAllowed',
        );
      }

      findPromoBrand.status = EnumPromoBrandStatus.FINISHED;

      const updatedPromoBrand = await this.insertPromoBrandToDb(findPromoBrand);

      //broadcast here
      await this.broadcastPromoBrand(
        updatedPromoBrand.id,
        'promo_brand.inactive',
      );

      return updatedPromoBrand;
    } catch (error) {
      this.errorReport(error, 'general.update.fail');
    }
  }

  // async getPromoVouchers(data: GetPromoVouchersDto): Promise<any> {
  //   try {
  //     const target = data.target;
  //     const orderType = data.order_type;
  //     const cartTotal = data.cart_total || null;
  //     const customerId = data.customer_id;
  //     const deliveryFee = data.delivery_fee || 0;

  //     const promoProviders = await this.getPromoProviders({
  //       target: target,
  //     });

  //     const vouchers = await this.voucherService.getActiveTargetVouchers({
  //       customer_id: customerId,
  //       target: target,
  //     });

  //     //=> cari promoProviders terbesar relatif ke order || delivery_fee
  //     const maxNotCombineablePromo: {
  //       promo: PromoProviderDocument;
  //       discount: number;
  //     } = {
  //       promo: null,
  //       discount: 0,
  //     };
  //     let accumulatedCombineablePromo = 0;
  //     const notAvailablePromos = [];
  //     const combineablePromos = [];
  //     const leftoverPromos = [];
  //     promoProviders.forEach((promo: PromoProviderDocument) => {
  //       //=> check apakah promo bisa dipakai
  //       if (!this.checkUsablePromo(promo, cartTotal, orderType)) {
  //         notAvailablePromos.push(promo);
  //       } else {
  //         const discount = this.calculatePromoDiscount(
  //           promo,
  //           cartTotal,
  //           deliveryFee,
  //         );
  //         if (promo.is_combinable) {
  //           accumulatedCombineablePromo += discount;
  //           combineablePromos.push(promo);
  //         } else {
  //           if (discount > maxNotCombineablePromo.discount) {
  //             if (maxNotCombineablePromo.promo) {
  //               leftoverPromos.push(maxNotCombineablePromo.promo);
  //             }
  //             maxNotCombineablePromo.promo = promo;
  //             maxNotCombineablePromo.discount = discount;
  //           } else {
  //             leftoverPromos.push(promo);
  //           }
  //         }
  //       }
  //     });

  //     //=> cari vouchers terbesar relatif ke order
  //     const maxNotCombineableVoucher: {
  //       voucher: VoucherDocument;
  //       discount: number;
  //     } = {
  //       voucher: null,
  //       discount: 0,
  //     };
  //     let accumulatedCombineableVoucher = 0;
  //     const notAvailableVouchers = [];
  //     const combineableVouchers = [];
  //     const leftoverVouchers = [];
  //     vouchers.forEach((voucher: VoucherDocument) => {
  //       //=> check apakah voucher bisa dipakai
  //       if (
  //         !this.voucherService.checkUsableVoucher(voucher, cartTotal, orderType)
  //       ) {
  //         notAvailableVouchers.push();
  //       } else {
  //         const discount = this.voucherService.calculateVoucherDiscount(
  //           voucher,
  //           cartTotal,
  //           deliveryFee,
  //         );
  //         if (voucher.is_combinable) {
  //           accumulatedCombineableVoucher += discount;
  //           combineableVouchers.push(voucher);
  //         } else {
  //           if (discount > maxNotCombineableVoucher.discount) {
  //             if (maxNotCombineableVoucher.voucher) {
  //               leftoverVouchers.push(maxNotCombineableVoucher.voucher);
  //             }
  //             maxNotCombineableVoucher.voucher = voucher;
  //             maxNotCombineableVoucher.discount = discount;
  //           } else {
  //             leftoverVouchers.push(voucher);
  //           }
  //         }
  //       }
  //     });

  //     const recommended = {
  //       promos: [],
  //       vouchers: [],
  //     };
  //     const available = {
  //       promos: [],
  //       vouchers: [],
  //     };

  //     //merge discount dan voucher
  //     const totalCombineableDiscount =
  //       accumulatedCombineablePromo + accumulatedCombineableVoucher;
  //     const maxUncombineDiscount = this.findMaxPromoVoucher(
  //       maxNotCombineablePromo,
  //       maxNotCombineableVoucher,
  //     );
  //     if (maxUncombineDiscount?.item.discount >= totalCombineableDiscount) {
  //       if (
  //         maxUncombineDiscount.type == 'PROMO' &&
  //         maxUncombineDiscount.item.promo
  //       ) {
  //         recommended.promos.push(maxUncombineDiscount.item.promo);
  //         if (maxNotCombineableVoucher.voucher) {
  //           leftoverVouchers.push(maxNotCombineableVoucher.voucher);
  //         }
  //       } else if (maxUncombineDiscount.type == 'VOUCHER') {
  //         recommended.vouchers.push(maxUncombineDiscount.item.voucher);
  //         if (maxNotCombineablePromo.promo) {
  //           leftoverVouchers.push(maxNotCombineablePromo.promo);
  //         }
  //       }
  //       available.promos.push(
  //         ...combineablePromos,
  //         ...leftoverPromos,
  //         ...notAvailablePromos,
  //       );
  //       available.vouchers.push(
  //         ...combineableVouchers,
  //         ...leftoverVouchers,
  //         ...notAvailableVouchers,
  //       );
  //     } else {
  //       recommended.promos.push(...combineablePromos);
  //       if (maxNotCombineablePromo.promo) {
  //         available.promos.push(
  //           maxNotCombineablePromo.promo,
  //           ...leftoverPromos,
  //           ...notAvailablePromos,
  //         );
  //       } else {
  //         available.promos.push(...notAvailablePromos);
  //       }

  //       recommended.vouchers.push(...combineableVouchers);
  //       if (maxNotCombineableVoucher.voucher) {
  //         available.vouchers.push(
  //           maxNotCombineableVoucher.voucher,
  //           ...leftoverVouchers,
  //           ...notAvailableVouchers,
  //         );
  //       } else {
  //         available.vouchers.push(...notAvailableVouchers);
  //       }
  //     }

  //     return {
  //       recommended,
  //       available,
  //     };
  //   } catch (error) {
  //     this.errorReport(error, 'general.list.fail');
  //   }
  // }

  // async getPromoProviders(data: GetPromoProvidersDto): Promise<any> {
  //   try {
  //     const targetList = ['ALL'];
  //     // const orderTypeList = ['DELIVERY_AND_PICKUP'];
  //     // const cartTotal = data.cart_total || null;
  //     const status = 'ACTIVE';

  //     targetList.push(data.target);

  //     // const orderType =
  //     //   data.order_type === 'DELIVERY' ? 'DELIVERY_ONLY' : 'PICKUP_ONLY';
  //     // orderTypeList.push(orderType);

  //     const { items } = await this.fetchPromoProvidersFromDb({
  //       promo_provider_id: '',
  //       limit: 9999,
  //       page: 1,
  //       target: '',
  //       type: '',
  //       periode_start: '',
  //       periode_end: '',
  //       status: status,
  //       order_type: '',
  //       cart_total: null,
  //       target_list: targetList,
  //       order_type_list: null,
  //     });

  //     return items;
  //   } catch (error) {
  //     this.errorReport(error, 'general.list.fail');
  //   }
  // }

  async getRecommendedPromos(data: GetRecommendedPromosDto): Promise<any> {
    try {
      const merchantId = data.merchant_id || null;
      if (!merchantId) {
        this.errorGenerator(
          merchantId,
          'merchant_id',
          'general.general.dataNotFound',
        );
      }
      const promoBrands = await this.promoBrandRepository.find({
        where: { merchant_id: merchantId },
      });

      const recommendedGlobalPromo = {
        promo: null,
        discountVal: null,
      };
      const recommendedShoppingDiscountPromo = {
        promo: null,
        discountVal: null,
      };
      const recommendedDeliveryDiscoutPromo = {
        promo: null,
        discountVal: null,
      };

      //=> Cari promo terbaik
      // rule:
      // - jika discount_type=PERCENTAGE, ambil discount_maximum sebagai nilai diskon
      // - jika discount_type=PRICE, ambil discount_value sebagai nilai diskon
      for (const promo of promoBrands) {
        let discountVal = 0;
        if (promo.discount_type == EnumPromoBrandDiscountType.PERCENTAGE) {
          discountVal = promo.discount_maximum || 0;
        } else {
          discountVal = promo.discount_value;
        }

        if (!recommendedGlobalPromo.promo) {
          recommendedGlobalPromo.promo = promo;
        }

        if (discountVal > recommendedGlobalPromo.discountVal) {
          recommendedGlobalPromo.promo = promo;
        }

        if (promo.type == EnumPromoBrandType.SHOPPING_COST) {
          if (!recommendedShoppingDiscountPromo.promo) {
            recommendedShoppingDiscountPromo.promo = promo;
          }

          if (discountVal > recommendedShoppingDiscountPromo.discountVal) {
            recommendedShoppingDiscountPromo.promo = promo;
          }
        } else {
          if (!recommendedDeliveryDiscoutPromo.promo) {
            recommendedDeliveryDiscoutPromo.promo = promo;
          }

          if (discountVal > recommendedDeliveryDiscoutPromo.discountVal) {
            recommendedDeliveryDiscoutPromo.promo = promo;
          }
        }
      }

      return {
        recommended_global_promo: recommendedGlobalPromo.promo,
        recommended_shopping_discount_promo:
          recommendedShoppingDiscountPromo.promo,
        recommended_delivery_discout_promo:
          recommendedDeliveryDiscoutPromo.promo,
      };
    } catch (error) {
      this.errorReport(error, 'general.list.fail');
    }
  }

  //=> Utility services. Only Services called internally defined here.

  // generateRecommendedPromoVoucers()

  checkMaxUncombineableOrCombineable(
    promo: { promo: any; discount: number },
    totalCombinedDiscount: number,
  ) {
    const singleDiscount = promo?.discount || null;
    if (singleDiscount >= totalCombinedDiscount) {
      return true;
    } else {
      return false;
    }
  }

  findMaxPromoVoucher(
    promo: {
      promo: PromoBrandDocument;
      discount: number;
    },
    voucher: {
      voucher: VoucherDocument;
      discount: number;
    },
  ): { type: string; item: any } {
    if (
      (promo.promo && !voucher.voucher) ||
      promo.discount >= voucher.discount
    ) {
      return { type: 'PROMO', item: promo };
    } else if (
      (!promo.promo && voucher.voucher) ||
      promo.discount < voucher.discount
    ) {
      return { type: 'VOUCHER', item: voucher };
    } else if (!promo.promo && !voucher.voucher) {
      return null;
    }
  }

  calculatePromoDiscount(
    promo: PromoBrandDocument,
    cartTotal: number,
    delieryFee: number,
  ): number {
    let discount = null;
    if (promo.type == EnumPromoBrandType.SHOPPING_COST) {
      discount =
        promo.discount_type == EnumPromoBrandDiscountType.PRICE
          ? promo.discount_value
          : Math.ceil((cartTotal * promo.discount_value) / 100);
    } else if (promo.type == EnumPromoBrandType.DELIVERY_COST) {
      discount =
        promo.discount_type == EnumPromoBrandDiscountType.PRICE
          ? promo.discount_value
          : Math.ceil((delieryFee * promo.discount_value) / 100);
    }
    if (discount > promo.discount_maximum && promo.discount_maximum) {
      discount = promo.discount_maximum;
    }
    return discount;
  }

  checkUsablePromo(
    promo: PromoBrandDocument,
    totalCart: number,
    orderType: string,
  ): boolean {
    if (
      (!promo.minimum_transaction || promo.minimum_transaction <= totalCart) &&
      (promo.order_type == EnumPromoBrandOrderType.DELIVERY_AND_PICKUP ||
        (promo.order_type == EnumPromoBrandOrderType.DELIVERY_ONLY &&
          orderType == 'DELIVERY') ||
        (promo.order_type == EnumPromoBrandOrderType.PICKUP_ONLY &&
          orderType == 'PICKUP'))
    ) {
      return true;
    }
    return false;
  }

  async findOneOrFail(promoId: string): Promise<PromoBrandDocument> {
    return this.promoBrandRepository
      .findOneOrFail({
        where: { id: promoId },
      })
      .catch(() => {
        const errors: RMessage = {
          value: promoId,
          property: 'promo_brand_id',
          constraint: [this.messageService.get('general.general.dataNotFound')],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      });
  }

  async createPromoBrandQueue(
    promoStatus: string,
    createdPromo: PromoBrandDocument,
  ) {
    if (promoStatus === EnumPromoBrandStatus.SCHEDULED) {
      const payloadStart: CreateAutoStartPromoBrandDto = {
        promo_brand_id: createdPromo.id,
        delay: DateTimeUtils.nowToDatetimeMilis(createdPromo.date_start),
      };
      await this.redisPromoBrandService.createAutoStartPromoBrandQueue(
        payloadStart,
      );
    }
    const payloadFinish: CreateAutoFinishPromoBrandDto = {
      promo_brand_id: createdPromo.id,
      delay: DateTimeUtils.nowToDatetimeMilis(createdPromo.date_end),
    };
    await this.redisPromoBrandService.createAutoFinishPromoBrandQueue(
      payloadFinish,
    );
  }

  async deletePromoBrandQueues(findPromoBrandId: string) {
    await this.redisPromoBrandService.deleteAutoStartPromoBrandQueue({
      promo_brand_id: findPromoBrandId,
    });

    await this.redisPromoBrandService.deleteAutoFinishPromoBrandQueue({
      promo_brand_id: findPromoBrandId,
    });
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

  checkPromoOverlap(
    promoBrands: PromoBrandDocument[],
    timeStart: Date,
    timeEnd: Date,
  ) {
    const unixStart = moment(timeStart).unix();
    const unixEnd = moment(timeEnd).unix();
    let flagOverlap = false;
    let flagBackDate = false;
    if (unixStart > unixEnd) {
      flagBackDate = true;
    }
    if (flagBackDate) {
      this.errorGenerator('', '', 'general.promoBrand.errorBackDate');
    }
    if (promoBrands.length > 0) {
      for (const promo of promoBrands) {
        const dbStart = moment(promo.date_start).unix();
        const dbEnd = moment(promo.date_end).unix();
        if (
          (unixStart > dbStart && unixStart < dbEnd) ||
          (unixStart > dbStart && unixEnd < dbEnd) ||
          (unixStart < dbStart && unixEnd > dbStart) ||
          (unixStart < dbStart && unixEnd > dbEnd) ||
          (unixStart == dbStart && unixEnd == dbEnd)
        ) {
          flagOverlap = true;
        }
      }
      if (flagOverlap) {
        this.errorGenerator('', '', 'general.promoBrand.errorOverlap');
      }
    }
  }

  checkPromoInPast(timeEnd: Date) {
    const now = new Date();

    if (now > timeEnd) {
      this.errorGenerator('', 'date_end', 'general.promoBrand.errorInPast');
    }
  }

  validatePromoData(data: BaseCreatePromoBrandDto) {
    if (
      data.minimum_transaction < 0 ||
      data.quota < 0 ||
      data.discount_maximum < 0 ||
      data.discount_value < 0
    ) {
      this.errorGenerator('', '', 'general.general.dataInvalid');
    }
  }

  async broadcastPromoBrand(id: string, event: string) {
    const broadcastPromo = await this.findOneOrFail(id);
    this.client.emit<PromoBrandDocument>('loyalties.' + event, broadcastPromo);
    this.logger.debug('BROADCASTED: loyalties.' + event);
  }

  // async findActiveDiscounts(store_id: string): Promise<DiscountDocument[]> {
  //   const findDiscount = await this.discountRepository.find({
  //     where: { store_id: store_id },
  //     relations: ['menu_price'],
  //   });
  //   if (!findDiscount) {
  //     throw new BadRequestException(
  //       this.responseService.error(
  //         HttpStatus.BAD_REQUEST,
  //         {
  //           value: '',
  //           property: '',
  //           constraint: [this.messageService.get('discount.error.not_found')],
  //         },
  //         'BAD_REQUEST',
  //       ),
  //     );
  //   }
  //   return findDiscount;
  // }
}
