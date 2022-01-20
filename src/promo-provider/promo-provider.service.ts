import { NatsClient } from '@alexy4744/nestjs-nats-jetstream-transporter';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import moment from 'moment';
import {
  CreateAutoFinishPromoProviderDto,
  CreateAutoStartPromoProviderDto,
} from 'src/common/redis/dto/redis-promo-provider.dto';
import { RedisPromoProviderService } from 'src/common/redis/promo-provider/redis-promo-provider.service';
import { PromoProviderUsageDocument } from 'src/database/entities/promo-provider-usage.entity';
import {
  EnumPromoProviderDiscountType,
  EnumPromoProviderOrderType,
  EnumPromoProviderStatus,
  EnumPromoProviderType,
  PromoProviderDocument,
} from 'src/database/entities/promo-provider.entity';
import { PromoProviderRepository } from 'src/database/repository/promo-provider.repository';
import { GetPromoVouchersDto } from 'src/internal/dto/get-promo-vouchers.dto';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { DateTimeUtils } from 'src/utils/date-time-utils';
import { VoucherDocument } from 'src/voucher/entities/voucher.entity';
import { VoucherService } from 'src/voucher/voucher.service';
import { Brackets } from 'typeorm';
import {
  BaseCreatePromoProviderDto,
  DbCreatePromoProviderDto,
} from './dto/create-promo-provider.dto';
import {
  DetailPromoProviderDto,
  ExtendedListPromoProviderDto,
  GetPromoProvidersDto,
  ListPromoProviderDto,
} from './dto/list-promo-provider.dto';
import {
  CancellPromoProviderDto,
  StopPromoProviderDto,
  UpdatePromoProviderDto,
  UpdatePromoProviderStatusActiveDto,
  UpdatePromoProviderStatusFinishDto,
} from './dto/update-promo-provider.dto';

@Injectable()
export class PromoProviderService {
  constructor(
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly promoProviderRepository: PromoProviderRepository,
    private readonly redisPromoProviderService: RedisPromoProviderService,
    private readonly voucherService: VoucherService,
  ) {}

  private readonly logger = new Logger(PromoProviderService.name);

  private readonly client = new NatsClient({
    connection: {
      servers: process.env.NATS_SERVERS.split(','),
    },
  });

  async createPromoProvider(data: BaseCreatePromoProviderDto) {
    try {
      this.validatePromoData(data);

      //Get Existing Promo
      // const promoProviders = await this.promoProviderRepository.find({
      //   where: {
      //     status: Any(['ACTIVE', 'SCHEDULED']),
      //   },
      // });

      const gmt_offset = '7';
      const timeStart = new Date(`${data.date_start} +${gmt_offset}`);
      const timeEnd = new Date(`${data.date_end} +${gmt_offset}`);

      // this.checkPromoOverlap(promoProviders, timeStart, timeEnd);

      this.checkPromoInPast(timeEnd);

      const now = new Date();

      const promoStatus =
        timeStart <= now
          ? EnumPromoProviderStatus.ACTIVE
          : EnumPromoProviderStatus.SCHEDULED;

      data.date_start = timeStart;
      data.date_end = timeEnd;
      data.status = promoStatus;

      const createdPromo = await this.insertPromoProviderToDb(data);

      await this.createPromoProviderQueue(promoStatus, createdPromo);

      if (promoStatus == EnumPromoProviderStatus.ACTIVE) {
        await this.broadcastPromoProvider(
          createdPromo.id,
          'promo_provider.active',
        );
      }

      return createdPromo;
    } catch (error) {
      this.errorReport(error, 'general.create.fail');
    }
  }

  async insertPromoProviderToDb(
    data: DbCreatePromoProviderDto,
  ): Promise<PromoProviderDocument> {
    const createPromo = this.promoProviderRepository.create(data);
    return this.promoProviderRepository.save(createPromo).catch((error) => {
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

  async listPromoProvider(data: ListPromoProviderDto): Promise<{
    total_item: number;
    limit: number;
    current_page: number;
    items: any[];
  }> {
    try {
      return this.fetchPromoProvidersFromDb({
        promo_provider_id: null,
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
        is_quota_available: null,
      });
    } catch (error) {
      this.errorReport(error, 'general.list.fail');
    }
  }

  async detailPromoProvider(data: DetailPromoProviderDto): Promise<any> {
    try {
      const { items } = await this.fetchPromoProvidersFromDb({
        promo_provider_id: data.promo_provider_id,
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
        is_quota_available: null,
      });
      const result = items?.[0];
      if (!result) {
        this.errorGenerator(
          data.promo_provider_id,
          'promo_provider_id',
          'general.general.dataNotFound',
        );
      }
      return result;
    } catch (error) {
      this.errorReport(error, 'general.general.dataNotFound');
    }
  }

  async fetchPromoProvidersFromDb(data: ExtendedListPromoProviderDto): Promise<{
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
      const promoProviderId = data.promo_provider_id || null;

      const cartTotal = data.cart_total || null;
      const targetList = data.target_list?.length ? data.target_list : null;
      const orderTypeList = data.order_type_list?.length
        ? data.order_type_list
        : null;

      const isQuotaAvailable = data.is_quota_available || null;

      const query = this.promoProviderRepository.createQueryBuilder('ppro');

      if (promoProviderId) {
        query.where('ppro.id = :promoProviderId', { promoProviderId });
      }

      if (target) {
        query.andWhere('ppro.target = :target', {
          target,
        });
      }

      if (type) {
        query.andWhere('ppro.type = :type', {
          type,
        });
      }

      if (dateStart) {
        query.andWhere('ppro.date_start >= :dateStart', {
          dateStart,
        });
      }

      if (dateEnd) {
        query.andWhere('ppro.date_end <= :dateEnd', {
          dateEnd,
        });
      }

      if (status) {
        query.andWhere('ppro.status = :status', {
          status,
        });
      }

      if (orderType) {
        query.andWhere('ppro.order_type = :orderType', {
          orderType,
        });
      }

      if (cartTotal) {
        query.andWhere(
          new Brackets((qb) => {
            qb.where('ppro.minimum_transaction <= :cartTotal', {
              cartTotal: cartTotal,
            })
              .orWhere('ppro.minimum_transaction IS NULL')
              .orWhere('ppro.minimum_transaction = 0');
          }),
        );
      }

      if (targetList) {
        query.andWhere('ppro.target in (:...targetList)', { targetList });
      }

      if (orderTypeList) {
        query.andWhere('ppro.order_type in (:...orderTypeList)', {
          orderTypeList,
        });
      }

      if (isQuotaAvailable) {
        query.leftJoinAndSelect(
          (qb) =>
            qb
              .select(
                'COUNT(DISTINCT(usg.id)) AS used_count, ppro.id AS promo_provider_id',
              )
              .from(PromoProviderDocument, 'ppro')
              .leftJoin(
                PromoProviderUsageDocument,
                'usg',
                `usg.promo_provider_id = ppro.id AND usg.status = 'USED'`,
              )
              .groupBy('ppro.id'),
          'usage',
          'usage.promo_provider_id = ppro.id',
        );

        query.andWhere(
          'usage.used_count < ppro.quota OR ppro.quota IS NULL OR ppro.quota = 0',
        );
      }

      query
        .orderBy('ppro.created_at', 'DESC')
        .skip((currentPage - 1) * perPage)
        .take(perPage);

      console.log(await query.getRawMany());

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

  async updatePromoProvider(data: UpdatePromoProviderDto) {
    try {
      this.validatePromoData(data);

      const findPromoProvider = await this.findOneOrFail(data.id);
      if (
        findPromoProvider.status === EnumPromoProviderStatus.CANCELLED ||
        findPromoProvider.status === EnumPromoProviderStatus.STOPPED
      ) {
        this.errorGenerator(
          findPromoProvider.status,
          'status',
          'general.general.statusNotAllowed',
        );
      }

      const gmt_offset = '7';
      const timeStart = new Date(`${data.date_start} +${gmt_offset}`);
      const timeEnd = new Date(`${data.date_end} +${gmt_offset}`);

      // const promoProviders = await this.promoProviderRepository.find({
      //   where: {
      //     status: Any(['ACTIVE', 'SCHEDULED']),
      //     id: Not(data.id),
      //   },
      // });

      // this.checkPromoOverlap(promoProviders, timeStart, timeEnd);

      this.checkPromoInPast(timeEnd);

      const now = new Date();

      const promoProviderStatus =
        timeStart <= now
          ? EnumPromoProviderStatus.ACTIVE
          : EnumPromoProviderStatus.SCHEDULED;

      findPromoProvider.date_start = timeStart;
      findPromoProvider.date_end = timeEnd;
      findPromoProvider.type = data.type;
      findPromoProvider.status = promoProviderStatus;
      findPromoProvider.order_type = data.order_type;
      findPromoProvider.target = data.target;
      findPromoProvider.minimum_transaction = data.minimum_transaction;
      findPromoProvider.quota = data.quota;
      findPromoProvider.discount_type = data.discount_type;
      findPromoProvider.discount_value = data.discount_value;
      findPromoProvider.is_combinable = data.is_combinable;

      const updatedPromoProvider = await this.insertPromoProviderToDb(
        findPromoProvider,
      );

      await this.deletePromoProviderQueues(updatedPromoProvider.id);

      await this.createPromoProviderQueue(
        promoProviderStatus,
        updatedPromoProvider,
      );

      if (promoProviderStatus == EnumPromoProviderStatus.ACTIVE) {
        await this.broadcastPromoProvider(
          updatedPromoProvider.id,
          'promo_provider.active',
        );
      }

      return updatedPromoProvider;
    } catch (error) {
      this.errorReport(error, 'general.update.fail');
    }
  }

  async cancellPromoProvider(data: CancellPromoProviderDto) {
    try {
      const findPromoProvider = await this.findOneOrFail(
        data.promo_provider_id,
      );

      if (findPromoProvider.status != EnumPromoProviderStatus.SCHEDULED) {
        this.errorGenerator(
          findPromoProvider.status,
          'status',
          'general.general.statusNotAllowed',
        );
      }

      findPromoProvider.cancellation_reason = data.cancellation_reason;
      findPromoProvider.status = EnumPromoProviderStatus.CANCELLED;

      const updatedPromo = await this.insertPromoProviderToDb(
        findPromoProvider,
      );

      await this.deletePromoProviderQueues(updatedPromo.id);

      await this.broadcastPromoProvider(
        updatedPromo.id,
        'promo_provider.inactive',
      );

      return updatedPromo;
    } catch (error) {
      this.errorReport(error, 'general.update.fail');
    }
  }

  async stopPromoProvider(data: StopPromoProviderDto) {
    try {
      const findPromoProvider = await this.findOneOrFail(
        data.promo_provider_id,
      );

      if (findPromoProvider.status != EnumPromoProviderStatus.ACTIVE) {
        this.errorGenerator(
          findPromoProvider.status,
          'status',
          'general.general.statusNotAllowed',
        );
      }

      findPromoProvider.cancellation_reason = data.cancellation_reason;
      findPromoProvider.status = EnumPromoProviderStatus.STOPPED;

      const updatedPromoProvider = await this.insertPromoProviderToDb(
        findPromoProvider,
      );

      await this.deletePromoProviderQueues(updatedPromoProvider.id);

      await this.broadcastPromoProvider(
        updatedPromoProvider.id,
        'promo_provider.inactive',
      );

      return updatedPromoProvider;
    } catch (error) {
      this.errorReport(error, 'general.update.fail');
    }
  }

  async updatePromoProviderStatusActive(
    data: UpdatePromoProviderStatusActiveDto,
  ): Promise<PromoProviderDocument> {
    try {
      const findPromoProvider = await this.findOneOrFail(
        data.promo_provider_id,
      );

      if (findPromoProvider.status !== EnumPromoProviderStatus.SCHEDULED) {
        this.errorGenerator(
          findPromoProvider.status,
          'status',
          'general.general.statusNotAllowed',
        );
      }

      findPromoProvider.status = EnumPromoProviderStatus.ACTIVE;

      const updatedPromo = await this.insertPromoProviderToDb(
        findPromoProvider,
      );

      //broadcast here
      await this.broadcastPromoProvider(
        updatedPromo.id,
        'promo_provider.active',
      );

      return updatedPromo;
    } catch (error) {
      this.errorReport(error, 'general.update.fail');
    }
  }

  async updatePromoProviderStatusFinished(
    data: UpdatePromoProviderStatusFinishDto,
  ): Promise<PromoProviderDocument> {
    try {
      const findPromoProvider = await this.findOneOrFail(
        data.promo_provider_id,
      );

      if (findPromoProvider.status !== EnumPromoProviderStatus.ACTIVE) {
        this.errorGenerator(
          findPromoProvider.status,
          'status',
          'general.general.statusNotAllowed',
        );
      }

      findPromoProvider.status = EnumPromoProviderStatus.FINISHED;

      const updatedPromoProvider = await this.insertPromoProviderToDb(
        findPromoProvider,
      );

      //broadcast here
      await this.broadcastPromoProvider(
        updatedPromoProvider.id,
        'promo_provider.inactive',
      );

      return updatedPromoProvider;
    } catch (error) {
      this.errorReport(error, 'general.update.fail');
    }
  }

  async getPromoVouchers(data: GetPromoVouchersDto): Promise<any> {
    try {
      const target = data.target;
      const orderType = data.order_type;
      const cartTotal = data.cart_total || null;
      const customerId = data.customer_id;
      const deliveryFee = data.delivery_fee || 0;

      const promoProviders = await this.getActivePromoProviders({
        target: target,
      });

      const vouchers = await this.voucherService.getActiveTargetVouchers({
        customer_id: customerId,
        target: target,
      });

      //=> cari promoProviders terbesar relatif ke order || delivery_fee
      const maxNotCombineablePromo: {
        promo: PromoProviderDocument;
        discount: number;
      } = {
        promo: null,
        discount: 0,
      };
      let accumulatedCombineablePromo = 0;
      const notAvailablePromos = [];
      const combineablePromos = [];
      const leftoverPromos = [];
      promoProviders.forEach((promo: PromoProviderDocument) => {
        //=> check apakah promo bisa dipakai
        if (!this.checkUsablePromo(promo, cartTotal, orderType)) {
          notAvailablePromos.push(promo);
        } else {
          const discount = this.calculatePromoDiscount(
            promo,
            cartTotal,
            deliveryFee,
          );
          if (promo.is_combinable) {
            accumulatedCombineablePromo += discount;
            combineablePromos.push(promo);
          } else {
            if (discount > maxNotCombineablePromo.discount) {
              if (maxNotCombineablePromo.promo) {
                leftoverPromos.push(maxNotCombineablePromo.promo);
              }
              maxNotCombineablePromo.promo = promo;
              maxNotCombineablePromo.discount = discount;
            } else {
              leftoverPromos.push(promo);
            }
          }
        }
      });

      //=> cari vouchers terbesar relatif ke order
      const maxNotCombineableVoucher: {
        voucher: VoucherDocument;
        discount: number;
      } = {
        voucher: null,
        discount: 0,
      };
      let accumulatedCombineableVoucher = 0;
      const notAvailableVouchers = [];
      const combineableVouchers = [];
      const leftoverVouchers = [];
      vouchers.forEach((voucher: VoucherDocument) => {
        //=> check apakah voucher bisa dipakai
        if (
          !this.voucherService.checkUsableVoucher(voucher, cartTotal, orderType)
        ) {
          notAvailableVouchers.push();
        } else {
          const discount = this.voucherService.calculateVoucherDiscount(
            voucher,
            cartTotal,
            deliveryFee,
          );
          if (voucher.is_combinable) {
            accumulatedCombineableVoucher += discount;
            combineableVouchers.push(voucher);
          } else {
            if (discount > maxNotCombineableVoucher.discount) {
              if (maxNotCombineableVoucher.voucher) {
                leftoverVouchers.push(maxNotCombineableVoucher.voucher);
              }
              maxNotCombineableVoucher.voucher = voucher;
              maxNotCombineableVoucher.discount = discount;
            } else {
              leftoverVouchers.push(voucher);
            }
          }
        }
      });

      const recommended = {
        promos: [],
        vouchers: [],
      };
      const available = {
        promos: [],
        vouchers: [],
      };

      //merge discount dan voucher
      const totalCombineableDiscount =
        accumulatedCombineablePromo + accumulatedCombineableVoucher;
      const maxUncombineDiscount = this.findMaxPromoVoucher(
        maxNotCombineablePromo,
        maxNotCombineableVoucher,
      );
      if (maxUncombineDiscount?.item.discount >= totalCombineableDiscount) {
        if (
          maxUncombineDiscount.type == 'PROMO' &&
          maxUncombineDiscount.item.promo
        ) {
          recommended.promos.push(maxUncombineDiscount.item.promo);
          if (maxNotCombineableVoucher.voucher) {
            leftoverVouchers.push(maxNotCombineableVoucher.voucher);
          }
        } else if (maxUncombineDiscount.type == 'VOUCHER') {
          recommended.vouchers.push(maxUncombineDiscount.item.voucher);
          if (maxNotCombineablePromo.promo) {
            leftoverVouchers.push(maxNotCombineablePromo.promo);
          }
        }
        available.promos.push(
          ...combineablePromos,
          ...leftoverPromos,
          ...notAvailablePromos,
        );
        available.vouchers.push(
          ...combineableVouchers,
          ...leftoverVouchers,
          ...notAvailableVouchers,
        );
      } else {
        recommended.promos.push(...combineablePromos);
        if (maxNotCombineablePromo.promo) {
          available.promos.push(
            maxNotCombineablePromo.promo,
            ...leftoverPromos,
            ...notAvailablePromos,
          );
        } else {
          available.promos.push(...notAvailablePromos);
        }

        recommended.vouchers.push(...combineableVouchers);
        if (maxNotCombineableVoucher.voucher) {
          available.vouchers.push(
            maxNotCombineableVoucher.voucher,
            ...leftoverVouchers,
            ...notAvailableVouchers,
          );
        } else {
          available.vouchers.push(...notAvailableVouchers);
        }
      }

      return {
        recommended,
        available,
      };
    } catch (error) {
      this.errorReport(error, 'general.list.fail');
    }
  }

  async getActivePromoProviders(data: GetPromoProvidersDto): Promise<any> {
    try {
      const targetList = ['ALL'];
      // const orderTypeList = ['DELIVERY_AND_PICKUP'];
      // const cartTotal = data.cart_total || null;
      const status = 'ACTIVE';

      targetList.push(data.target);

      // const orderType =
      //   data.order_type === 'DELIVERY' ? 'DELIVERY_ONLY' : 'PICKUP_ONLY';
      // orderTypeList.push(orderType);

      const { items } = await this.fetchPromoProvidersFromDb({
        promo_provider_id: '',
        limit: 9999,
        page: 1,
        target: '',
        type: '',
        periode_start: '',
        periode_end: '',
        status: status,
        order_type: '',
        cart_total: null,
        target_list: targetList,
        order_type_list: null,
        is_quota_available: true,
      });

      return items;
    } catch (error) {
      this.errorReport(error, 'general.list.fail');
    }
  }

  //=> Utility services. Only Services called internally defined here.

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
      promo: PromoProviderDocument;
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
    promo: PromoProviderDocument,
    cartTotal: number,
    delieryFee: number,
  ): number {
    let discount = null;
    if (promo.type == EnumPromoProviderType.SHOPPING_COST) {
      discount =
        promo.discount_type == EnumPromoProviderDiscountType.PRICE
          ? promo.discount_value
          : Math.ceil((cartTotal * promo.discount_value) / 100);
    } else if (promo.type == EnumPromoProviderType.DELIVERY_COST) {
      discount =
        promo.discount_type == EnumPromoProviderDiscountType.PRICE
          ? promo.discount_value
          : Math.ceil((delieryFee * promo.discount_value) / 100);
    }
    if (discount > promo.discount_maximum && promo.discount_maximum) {
      discount = promo.discount_maximum;
    }
    return discount;
  }

  checkUsablePromo(
    promo: PromoProviderDocument,
    totalCart: number,
    orderType: string,
  ): boolean {
    if (
      (!promo.minimum_transaction || promo.minimum_transaction <= totalCart) &&
      (promo.order_type == EnumPromoProviderOrderType.DELIVERY_AND_PICKUP ||
        (promo.order_type == EnumPromoProviderOrderType.DELIVERY_ONLY &&
          orderType == 'DELIVERY') ||
        (promo.order_type == EnumPromoProviderOrderType.PICKUP_ONLY &&
          orderType == 'PICKUP'))
    ) {
      return true;
    }
    return false;
  }

  async findOneOrFail(promoId: string): Promise<PromoProviderDocument> {
    return this.promoProviderRepository
      .findOneOrFail({
        where: { id: promoId },
      })
      .catch(() => {
        const errors: RMessage = {
          value: promoId,
          property: 'promo_provider_id',
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

  async createPromoProviderQueue(
    promoStatus: string,
    createdPromo: PromoProviderDocument,
  ) {
    if (promoStatus === EnumPromoProviderStatus.SCHEDULED) {
      const payloadStart: CreateAutoStartPromoProviderDto = {
        promo_provider_id: createdPromo.id,
        delay: DateTimeUtils.nowToDatetimeMilis(createdPromo.date_start),
      };
      await this.redisPromoProviderService.createAutoStartPromoProviderQueue(
        payloadStart,
      );
    }
    const payloadFinish: CreateAutoFinishPromoProviderDto = {
      promo_provider_id: createdPromo.id,
      delay: DateTimeUtils.nowToDatetimeMilis(createdPromo.date_end),
    };
    await this.redisPromoProviderService.createAutoFinishPromoProviderQueue(
      payloadFinish,
    );
  }

  async deletePromoProviderQueues(findPromoProviderId: string) {
    await this.redisPromoProviderService.deleteAutoStartPromoProviderQueue({
      promo_provider_id: findPromoProviderId,
    });

    await this.redisPromoProviderService.deleteAutoFinishPromoProviderQueue({
      promo_provider_id: findPromoProviderId,
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
    promoProviders: PromoProviderDocument[],
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
      this.errorGenerator('', '', 'general.promoProvider.errorBackDate');
    }
    if (promoProviders.length > 0) {
      for (const promo of promoProviders) {
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
        this.errorGenerator('', '', 'general.promoProvider.errorOverlap');
      }
    }
  }

  checkPromoInPast(timeEnd: Date) {
    const now = new Date();

    if (now > timeEnd) {
      this.errorGenerator('', 'date_end', 'general.promoProvider.errorInPast');
    }
  }

  validatePromoData(data: BaseCreatePromoProviderDto) {
    // if (
    //   data.discount_type === EnumPromoProviderDiscountType.PERCENTAGE &&
    //   typeof data.discount_maximum !== 'number'
    // ) {
    //   this.errorGenerator(
    //     '',
    //     'discount_maximum',
    //     'general.promoProvider.errorDiscountMaximum',
    //   );
    // }

    if (
      data.minimum_transaction < 0 ||
      data.quota < 0 ||
      data.discount_maximum < 0 ||
      data.discount_value < 0
    ) {
      this.errorGenerator('', '', 'general.general.dataInvalid');
    }
  }

  async broadcastPromoProvider(id: string, event: string) {
    const broadcastPromo = await this.findOneOrFail(id);
    this.client.emit<PromoProviderDocument>(
      'loyalties.' + event,
      broadcastPromo,
    );
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
