import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import moment from 'moment';
import {
  CreateAutoFinishVoucherPackageDto,
  CreateAutoStartVoucherPackageDto,
} from 'src/common/redis/dto/redis-voucher-package.dto';
import { RedisVoucherPackageService } from 'src/common/redis/voucher_package/redis-voucher_package.service';
import { MasterVouchersDocument } from 'src/master_vouchers/entities/master_voucher.entity';
import { MasterVoucherService } from 'src/master_vouchers/master_voucher.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { DateTimeUtils } from 'src/utils/date-time-utils';
import { StatusVoucherEnum } from 'src/voucher/entities/voucher.entity';
import { VoucherService } from 'src/voucher/voucher.service';
import {
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  SelectQueryBuilder,
} from 'typeorm';
import { CreateVoucherPackageDto } from './dto/create-voucher-package.dto';
import { ListVoucherPackageDto } from './dto/list-voucher-package.dto';
import {
  CancelVoucherPackageDto,
  StopVoucherPackageDto,
  UpdateVoucherPackageStatusActiveDto,
  UpdateVoucherPackageStatusFinishDto,
} from './dto/update-voucher-package.dto';
import { VoucherPackagesMasterVouchersDocument } from './entities/voucher-package-master-voucher.entity';
import {
  StatusVoucherPackage,
  VoucherPackageDocument,
} from './entities/voucher-package.entity';
import { VoucherPackagesRepository } from './repository/voucher_package.repository';
import { VoucherPackagesMasterVouchersRepository } from './repository/voucher_package._master_voucher.repository';

@Injectable()
export class VoucherPackagesService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly masterVoucherService: MasterVoucherService,
    private readonly voucherPackageRepository: VoucherPackagesRepository,
    private readonly voucherPackagesMasterVouchersRepository: VoucherPackagesMasterVouchersRepository,
    private readonly redisVoucherPackageService: RedisVoucherPackageService,
    private readonly voucherService: VoucherService,
  ) {}
  private readonly logger = new Logger(VoucherPackagesService.name);

  //CRUD
  async create(
    params: CreateVoucherPackageDto,
  ): Promise<VoucherPackageDocument> {
    const createObj: Partial<VoucherPackageDocument> = {
      ...params,
      status: StatusVoucherPackage.SCHEDULED,
    };
    try {
      const voucherPackage = await this.voucherPackageRepository.save(
        createObj,
      );

      const voucherPackageMasterVouhers = [];
      for (const masterVoucherId in params.master_vouchers) {
        if (
          Object.prototype.hasOwnProperty.call(
            params.master_vouchers,
            masterVoucherId,
          )
        ) {
          const quantity = params.master_vouchers[masterVoucherId];
          await this.masterVoucherService.getAndValidateMasterVoucherById(
            masterVoucherId,
          );
          const paramVoucherPackageMasterVoucher: Partial<VoucherPackagesMasterVouchersDocument> =
            {
              voucher_package_id: voucherPackage.id,
              master_voucher_id: masterVoucherId,
              quantity,
            };
          const voucherPackageMasterVoucher =
            await this.voucherPackagesMasterVouchersRepository.save(
              paramVoucherPackageMasterVoucher,
            );
          voucherPackageMasterVouhers.push(voucherPackageMasterVoucher);
        }
      }
      voucherPackage.voucher_package_master_vouchers =
        voucherPackageMasterVouhers;

      this.createVoucherPackageQueue(voucherPackage);
      return voucherPackage;
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

  mainQuery(): SelectQueryBuilder<VoucherPackageDocument> {
    const query = this.voucherPackageRepository
      .createQueryBuilder('voucher_package')
      .leftJoinAndSelect(
        'voucher_package.voucher_package_master_vouchers',
        'voucher_package_master_vouchers',
      )
      .leftJoinAndSelect(
        'voucher_package_master_vouchers.master_voucher',
        'master_voucher',
      );
    return query;
  }

  async getList(params: ListVoucherPackageDto): Promise<{
    current_page: number;
    total_item: number;
    limit: number;
    items: VoucherPackageDocument[];
  }> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 10;
      const offset = (page - 1) * limit;

      let where = {};

      if (params.target) where = { ...where, target: params.target };
      if (params.status) where = { ...where, status: params.status };
      if (params.search) where = { ...where, name: Like(`%${params.search}%`) };
      if (params.periode_start) {
        where = { ...where, date_start: MoreThanOrEqual(params.periode_start) };
      }
      if (params.periode_end) {
        where = { ...where, date_end: LessThanOrEqual(params.periode_end) };
      }
      if (params.price_min) {
        where = { ...where, price: MoreThanOrEqual(params.price_min) };
      }
      if (params.price_min) {
        where = { ...where, price: LessThanOrEqual(params.price_max) };
      }

      const query = this.mainQuery().where(where).take(limit).skip(offset);

      const items = await query.getMany();
      const count = await query.getCount();

      const listItems = {
        current_page: +page,
        total_item: count,
        limit: +limit,
        items: items,
      };

      return listItems;
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

  async getDetail(id) {
    try {
      const query = this.mainQuery().where({ id });
      return query.getOne();
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('general.get.fail'),
              error.message,
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  async cancel(params: CancelVoucherPackageDto) {
    const findVoucherPackage = await this.getAndValidateVoucherPackageById(
      params.id,
    );

    if (findVoucherPackage.status != StatusVoucherPackage.SCHEDULED) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: findVoucherPackage.status,
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

    try {
      findVoucherPackage.cancellation_reason = params.cancellation_reason;
      findVoucherPackage.status = StatusVoucherPackage.CANCELLED;

      const updatedVoucherPackage = await this.voucherPackageRepository.save(
        findVoucherPackage,
      );

      // await this.deleteVoucherPackageQueues(updatedVoucherPackage.id);

      return updatedVoucherPackage;
    } catch (error) {
      this.logger.error(error);
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

  async stop(params: StopVoucherPackageDto) {
    const findVoucherPackage = await this.getAndValidateVoucherPackageById(
      params.id,
    );

    if (findVoucherPackage.status != StatusVoucherPackage.ACTIVE) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: findVoucherPackage.status,
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

    try {
      findVoucherPackage.cancellation_reason = params.cancellation_reason;
      findVoucherPackage.status = StatusVoucherPackage.STOPPED;

      const updatedVoucherPackage = await this.voucherPackageRepository.save(
        findVoucherPackage,
      );

      // await this.deleteVoucherPackageQueues(updatedVoucherPackage.id);

      return updatedVoucherPackage;
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

  async getAndValidateVoucherPackageById(
    voucherPackageId: string,
  ): Promise<VoucherPackageDocument> {
    const voucherPackage = await this.getDetail(voucherPackageId).catch(
      (error) => {
        throw error;
      },
    );
    if (!voucherPackage) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: voucherPackageId,
            property: 'id',
            constraint: [
              this.messageService.get('general.general.id_notfound'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    return voucherPackage;
  }
  async getAndValidateAvailableVoucherPackageById(
    voucherPackageId: string,
  ): Promise<VoucherPackageDocument> {
    const voucherPackage = await this.getAndValidateVoucherPackageById(
      voucherPackageId,
    ).catch((error) => {
      throw error;
    });
    if (voucherPackage.status != StatusVoucherPackage.ACTIVE) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: voucherPackage.status,
            property: 'status',
            constraint: [
              this.messageService.get('general.general.notAvailable'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    return voucherPackage;
  }

  async orderVoucherPackage(voucherPackageId: string, customerId: string) {
    const voucherPackage = await this.getAndValidateAvailableVoucherPackageById(
      voucherPackageId,
    );
    for (
      let i = 0;
      i < voucherPackage.voucher_package_master_vouchers.length;
      i++
    ) {
      const masterVoucher =
        voucherPackage.voucher_package_master_vouchers[i].master_voucher;
      await this.createVoucherByVoucherPackageId(
        masterVoucher,
        customerId,
        voucherPackage.target,
        voucherPackageId,
      );
    }

    //TODO: tambah kan fungsi seperti ini this.updateVoucherCodeEmpty(voucherCode.id);
  }

  async createVoucherByVoucherPackageId(
    masterVoucher: MasterVouchersDocument,
    customerId: string,
    target: string,
    voucherPackageId: string,
  ) {
    const masterVoucherVoucherCodes =
      await this.voucherService.fetchMasterVoucherVoucherCodes({
        loyaltiesVoucherCodeId: null,
        loyaltiesMasterVoucherId: masterVoucher.id,
      });

    let vouchersTotal = 0;
    const postVoucherDatas = [];
    for (let i = 0; i < masterVoucherVoucherCodes.length; i++) {
      const master_voucher = masterVoucherVoucherCodes[i].master_voucher;
      const quantity = masterVoucherVoucherCodes[i].quantity;
      const date_start = new Date();
      const days = this.voucherService.getDurationInt(master_voucher.duration);
      const date_end = moment(date_start).add(days, 'days');

      for (let y = 0; y < quantity; y++) {
        vouchersTotal += 1;
        const postVoucherData = {
          voucher_package_id: voucherPackageId,
          master_voucher_id: master_voucher.id,
          customer_id: customerId,
          code: Math.floor(Math.random() * (100 - 1 + 1)) + 1,
          type: master_voucher.type,
          order_type: master_voucher.order_type,
          target,
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
    await this.voucherService.createVoucherBulk(postVoucherDatas);
  }

  // QUEUE
  async deleteVoucherPackageQueues(findVoucherPackageId: string) {
    await this.redisVoucherPackageService.deleteAutoStartVoucherPackageQueue({
      voucher_package_id: findVoucherPackageId,
    });

    await this.redisVoucherPackageService.deleteAutoFinishVoucherPackageQueue({
      voucher_package_id: findVoucherPackageId,
    });
  }

  async createVoucherPackageQueue(voucherPackage: VoucherPackageDocument) {
    const payloadStart: CreateAutoStartVoucherPackageDto = {
      voucher_package_id: voucherPackage.id,
      delay: DateTimeUtils.nowToDatetimeMilis(voucherPackage.date_start),
    };
    await this.redisVoucherPackageService.createAutoStartVoucherPackageQueue(
      payloadStart,
    );
    const payloadFinish: CreateAutoFinishVoucherPackageDto = {
      voucher_package_id: voucherPackage.id,
      delay: DateTimeUtils.nowToDatetimeMilis(voucherPackage.date_end),
    };
    await this.redisVoucherPackageService.createAutoFinishVoucherPackageQueue(
      payloadFinish,
    );
  }

  async updateVoucherPackageStatusActive(
    data: UpdateVoucherPackageStatusActiveDto,
  ): Promise<VoucherPackageDocument> {
    try {
      const findVoucherPackage =
        await this.voucherPackageRepository.findOneOrFail({
          where: { id: data.voucher_package_id },
        });

      if (findVoucherPackage.status !== StatusVoucherPackage.SCHEDULED) {
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

      findVoucherPackage.status = StatusVoucherPackage.ACTIVE;

      const updatedVoucherPackage = await this.voucherPackageRepository.save(
        findVoucherPackage,
      );
      return updatedVoucherPackage;
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

  async updateVoucherPackageStatusFinished(
    data: UpdateVoucherPackageStatusFinishDto,
  ): Promise<VoucherPackageDocument> {
    try {
      const findVoucherPackage =
        await this.voucherPackageRepository.findOneOrFail({
          where: { id: data.voucher_package_id },
        });

      if (findVoucherPackage.status !== StatusVoucherPackage.ACTIVE) {
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

      findVoucherPackage.status = StatusVoucherPackage.FINISHED;

      const updatedVoucherPackage = await this.voucherPackageRepository.save(
        findVoucherPackage,
      );
      return updatedVoucherPackage;
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
