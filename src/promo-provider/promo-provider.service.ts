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
import { RedisPromoProviderService } from 'src/common/redis/redis-promo-provider.service';
import {
  EnumPromoProviderDiscountType,
  EnumPromoProviderStatus,
  PromoProviderDocument,
} from 'src/database/entities/promo-provider.entity';
import { PromoProviderRepository } from 'src/database/repository/promo-provider.repository';
import { GetPromoProvidersDto } from 'src/internal/dto/get-promo-providers.dto';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { DateTimeUtils } from 'src/utils/date-time-utils';
import { Any, Not } from 'typeorm';
import {
  BaseCreatePromoProviderDto,
  DbCreatePromoProviderDto,
} from './dto/create-promo-provider.dto';
import {
  DetailPromoProviderDto,
  ExtendedListPromoProviderDto,
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
  ) {}

  private readonly logger = new Logger(PromoProviderService.name);

  // private readonly client = new NatsClient({
  //   connection: {
  //     servers: process.env.NATS_SERVERS.split(','),
  //   },
  // });

  async createPromoProvider(data: BaseCreatePromoProviderDto) {
    try {
      this.validatePromoData(data);

      //Get Existing Promo
      const promoProviders = await this.promoProviderRepository.find({
        where: {
          status: Any(['ACTIVE', 'SCHEDULED']),
        },
      });

      const gmt_offset = '7';
      const timeStart = new Date(`${data.date_start} +${gmt_offset}`);
      const timeEnd = new Date(`${data.date_end} +${gmt_offset}`);

      this.checkPromoOverlap(promoProviders, timeStart, timeEnd);

      this.checkPromoInPast(timeEnd);

      const now = new Date();

      const promoStatus =
        timeStart <= now
          ? EnumPromoProviderStatus.ACTIVE
          : EnumPromoProviderStatus.SCHEDULED;

      // const broadcastEvent =
      //   promoStatus === EnumPromoProviderStatus.ACTIVE
      //     ? 'discount.started'
      //     : 'discount.scheduled';

      data.date_start = timeStart;
      data.date_end = timeEnd;
      data.status = promoStatus;

      const createdPromo = await this.insertPromoProviderToDb(data);

      await this.createPromoProviderQueue(promoStatus, createdPromo);

      // await this.broadcastDiscount(createdDiscount.id, broadcastEvent);

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
        minimum_transaction: null,
        target_list: null,
        order_type_list: null,
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
        minimum_transaction: null,
        target_list: null,
        order_type_list: null,
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

      const minimumTransaction = data.minimum_transaction || null;
      const targetList = data.target_list || null;
      const orderTypeList = data.order_type_list || null;

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

      query
        .orderBy('ppro.created_at', 'DESC')
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

      const promoProviders = await this.promoProviderRepository.find({
        where: {
          status: Any(['ACTIVE', 'SCHEDULED']),
          id: Not(data.id),
        },
      });

      this.checkPromoOverlap(promoProviders, timeStart, timeEnd);

      this.checkPromoInPast(timeEnd);

      const now = new Date();

      const promoProviderStatus =
        timeStart <= now
          ? EnumPromoProviderStatus.ACTIVE
          : EnumPromoProviderStatus.SCHEDULED;

      // const broadcastEvent =
      //   discountStatus === EnumDiscountStatus.ACTIVE
      //     ? 'discount.started'
      //     : 'discount.scheduled';

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

      // await this.broadcastDiscount(updatedDiscount.id, broadcastEvent);

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

      // await this.broadcastDiscount(updatedPromo.id, 'discount.cancelled');

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

      // await this.broadcastDiscount(updatedDiscount.id, 'discount.stopped');

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
      // await this.broadcastDiscount(updatedDiscount.id, 'discount.started');

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
      // await this.broadcastPromoProvider(updatedPromoProvider.id, 'promoprovider.finished');

      return updatedPromoProvider;
    } catch (error) {
      this.errorReport(error, 'general.update.fail');
    }
  }

  async getPromoProviders(
    data: GetPromoProvidersDto,
  ): Promise<PromoProviderDocument[]> {
    try {
      const targetList = []; //update this!
      const orderTypeList = []; //update this!
      const cartTotal = data.cart_total || null; //update this!
      const status = 'ACTIVE';

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
        minimum_transaction: null, //update this!
        target_list: null, //update this!
        order_type_list: null, //update this!
      });

      return items;
    } catch (error) {
      this.errorReport(error, 'general.list.fail');
    }
  }

  //=> Utility services. Only Services called internally defined here.

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

  // async broadcastDiscount(id: string, event: string) {
  //   const broadcastDiscount = await this.findOneOrFail(id);
  //   this.client.emit<DiscountDocument>('catalogs.' + event, broadcastDiscount);
  //   this.logger.debug('BROADCASTED: catalogs.' + event);
  // }

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
