import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';
import {
  CreateAutoFinishVoucherPosDto,
  CreateAutoStartVoucherPosDto,
} from 'src/common/redis/dto/redis-voucher-pos.dto';
import { RedisVoucherPosService } from 'src/common/redis/voucher_pos/redis-voucher_pos.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { DateTimeUtils } from 'src/utils/date-time-utils';
import { VoucherCodeService } from 'src/voucher_code/voucher_code.service';
import { Brackets, ILike, LessThan, MoreThan } from 'typeorm';
import {
  CreateVoucherPosDto,
  UpdateVoucherPosDto,
  UpdateVoucherPosStatusActiveDto,
  UpdateVoucherPosStatusFinishDto,
} from './dto/voucher-pos.dto';
import {
  StatusVoucherPosGroup,
  VoucherPosDocument,
} from './entities/voucher-pos.entity';
import {
  VoucherPosRepository,
  VoucherPosStoreRepository,
} from './repository/voucher-pos.repository';

@Injectable()
export class VoucherPosService {
  /**
   *
   * @param responseService
   * @param messageService
   * @param voucherPosRepo
   * @param voucherCodeService
   */
  constructor(
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly voucherPosRepo: VoucherPosRepository,
    private readonly voucherCodeService: VoucherCodeService,
    private readonly httpservice: HttpService,
    private readonly redisVoucherPosService: RedisVoucherPosService,
    private readonly voucherPosStoreRepo: VoucherPosStoreRepository,
  ) {}

  private readonly logger = new Logger(VoucherPosService.name);

  addSelectStatement() {
    const addSelectState = `
    (case
      when (now() between vp.date_start AND vp.date_end) AND vp.stopped_at IS NULL AND vp.deleted_at IS NULL
        then '${StatusVoucherPosGroup.ACTIVE}'
      when (now() < vp.date_start) AND vp.stopped_at IS NULL AND vp.deleted_at IS NULL
        then '${StatusVoucherPosGroup.SCHEDULED}'
      when vp.deleted_at IS NOT NULL AND vp.stopped_at IS NULL
        then '${StatusVoucherPosGroup.CANCELLED}'
      when now() > vp.date_end AND vp.stopped_at IS NULL
        then '${StatusVoucherPosGroup.FINISHED}'
      when vp.stopped_at IS NOT NULL
        then '${StatusVoucherPosGroup.STOPPED}'
    end)
  `;

    const selectOptions = [
      'vp.id as id',
      'vp.name AS name ',
      'vp.group_id AS group_id ',
      'vp.brand_id AS brand_id ',
      'vp.brand_name AS brand_name ',
      'vp.sales_mode AS sales_mode ',
      'vp.discount_type AS discount_type ',
      'vp.nominal AS nominal ',
      'vp.min_transaction AS min_transaction ',
      'vp.discount_max AS discount_max ',
      'vp.date_start AS date_start ',
      'vp.date_end AS date_end ',
      'vp.abort_reason AS abort_reason ',
      'vp.period_type AS period_type ',
      'vp.daily_period AS daily_period ',
      'vp.is_validated AS is_validated ',
      'vp.is_combined AS is_combined ',
      'vp.created_at AS created_at ',
      'vp.updated_at AS updated_at ',
      'vp.deleted_at AS deleted_at ',
      'vp.stopped_at AS stopped_at ',
      addSelectState + ' AS status',
    ];
    return selectOptions;
  }
  /**
   *
   * @param data
   * @returns
   */
  async getListVoucherPos(data) {
    try {
      const page = data.page || 1;
      const limit = data.limit || 10;
      const offset = (page - 1) * limit;

      let qry = {};

      if (data.group_id) qry = { ...qry, group_id: data.group_id };
      if (data.brand_id) qry = { ...qry, brand_id: data.brand_id };
      if (data.search) qry = { ...qry, name: ILike(`%${data.search}%`) };
      if (data.date_start)
        qry = { ...qry, date_start: MoreThan(data.date_start) };
      if (data.date_end) qry = { ...qry, date_end: LessThan(data.date_end) };

      const query = this.voucherPosRepo
        .createQueryBuilder('vp')
        .select(this.addSelectStatement())
        .leftJoin(
          'loyalties_voucher_pos_store',
          'vps',
          'vps.voucher_pos_id = vp.id',
        )
        .where(qry)
        .withDeleted()
        .groupBy('vp.id')
        .orderBy('vp.created_at', 'DESC')
        .take(limit)
        .skip(offset);

      if (data.status) {
        switch (data.status) {
          case StatusVoucherPosGroup.ACTIVE:
            query.andWhere(
              'now() BETWEEN vp.date_start AND vp.date_end AND vp.stopped_at IS NULL AND vp.deleted_at IS NULL',
            );
            break;
          case StatusVoucherPosGroup.SCHEDULED:
            query.andWhere(
              'now() < vp.date_start AND vp.stopped_at IS NULL AND vp.deleted_at IS NULL',
            );
            break;
          case StatusVoucherPosGroup.CANCELLED:
            query.andWhere(
              'vp.deleted_at IS NOT NULL AND vp.stopped_at IS NULL',
            );
            break;
          case StatusVoucherPosGroup.FINISHED:
            query.andWhere('now() > vp.date_end AND vp.stopped_at IS NULL');
            break;
          case StatusVoucherPosGroup.STOPPED:
            query.andWhere('vp.stopped_at IS NOT NULL');
            break;
          default:
            break;
        }
      }

      if (typeof data.period != 'undefined' && data.period != '') {
        query.andWhere(
          ':period BETWEEN vp.date_start AND vp.date_end AND vp.deleted_at IS NULL AND vp.stopped_at IS NULL',
          {
            period: data.period,
          },
        );

        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const weekOfDay = DateTimeUtils.getDayOfWeekInWIB();

        const dayConverter = {
          1: 'senin',
          2: 'selasa',
          3: 'rabu',
          4: 'kamis',
          5: 'jumat',
          6: 'sabtu',
          7: 'minggu',
        };

        query.andWhere(
          new Brackets((qb) => {
            qb.where(
              'case ' +
                'when vp.period_type = :none ' +
                'then vp.daily_period::jsonb ? :empty_period ' +
                'when vp.period_type = :monthy_period ' +
                'then vp.daily_period::jsonb ? :dayNumber ' +
                'else vp.daily_period::jsonb ? :weekOfDay ' +
                'end',
              {
                none: 'NONE',
                empty_period: '',
                monthy_period: 'MONTHLY',
                dayNumber: dd,
                weekOfDay: dayConverter[weekOfDay],
              },
            );
          }),
        );
      }

      if (typeof data.sales_mode != 'undefined') {
        query.andWhere('vp.sales_mode::jsonb ? :sales_mode', {
          sales_mode: data.sales_mode,
        });
      }
      if (typeof data.store_id != 'undefined' && data.store_id != '') {
        query.andWhere('vps.store_id = :store_id', { store_id: data.store_id });
      }

      // this.logger.warn(query.getQuery());
      const items = await query.getRawMany();
      const count = await query.getCount();

      const listItems = {
        current_page: parseInt(page),
        total_item: count,
        limit: parseInt(limit),
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
    return { test: true };
  }

  /**
   *
   * @param data
   * @returns
   */
  async createVoucherPos(data: CreateVoucherPosDto) {
    const gmt_offset = '7';
    const timeStart = new Date(`${data.date_start} +${gmt_offset}`);
    const timeEnd = new Date(`${data.date_end} +${gmt_offset}`);

    // compare date_start & date_end
    this.voucherCodeService.checkVoucherCodeInPast(timeEnd);

    data.date_start = timeStart;
    data.date_end = timeEnd;

    const createdVoucher = await this.voucherPosRepo
      .createQueryBuilder()
      .insert()
      .into('loyalties_voucher_pos')
      .values(data)
      .execute();

    // const detailsVoucher = await this.voucherPosRepo.findOneOrFail(
    //   createdVoucher.raw.id,
    // );
    // await this.createVoucherPosQueue(status, detailsVoucher);
    return createdVoucher;
  }

  /**
   *
   * @param data
   * @returns
   */
  async updateVoucherPos(data: UpdateVoucherPosDto) {
    try {
      const findVoucher = await this.voucherPosRepo.findOneOrFail({
        where: { id: data.id },
      });

      if (findVoucher) {
        const gmt_offset = '7';
        const timeStart = new Date(`${data.date_start} +${gmt_offset}`);
        const timeEnd = new Date(`${data.date_end} +${gmt_offset}`);

        data.date_start = timeStart;
        data.date_end = timeEnd;

        const updateVoucher = await this.voucherPosRepo
          .createQueryBuilder()
          .update('loyalties_voucher_pos')
          .set(data)
          .where('id = :id', { id: findVoucher.id })
          .execute();

        return updateVoucher;
      }

      return this.responseService.error(
        HttpStatus.BAD_REQUEST,
        {
          value: 'status',
          property: 'status',
          constraint: [
            this.messageService.get('general.update.fail'),
            'id is not found',
          ],
        },
        'Bad Request',
      );
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

  /**
   *
   * @param id
   * @returns
   */
  async getVoucherPosDetail(id) {
    try {
      const result = await this.voucherPosRepo
        .createQueryBuilder('vp')
        .select(this.addSelectStatement())
        // .addSelect('assigned_store.store_id')
        // .leftJoin('vp.assigned_store', 'assigned_store')
        .where('vp.id = :id', { id: id })
        .getRawOne();

      if (result) {
        const store_ids = [];
        const assigned_store = await this.voucherPosStoreRepo
          .createQueryBuilder()
          .where('voucher_pos_id = :id', { id: id })
          .getMany();

        if (assigned_store) {
          for (let index = 0; index < assigned_store.length; index++) {
            store_ids.push(assigned_store[index].store_id);
          }
        }

        const callMerchantService = await this.callInternalMerchantsStores(
          store_ids,
        );

        const listStore = [];
        for (
          let index = 0;
          index < Object.keys(callMerchantService).length;
          index++
        ) {
          listStore[index] = {
            id: callMerchantService[index].id,
            name: callMerchantService[index].name,
            phone: callMerchantService[index].phone,
            is_store_open: callMerchantService[index].is_store_open,
            is_open: callMerchantService[index].is_open_24h,
            status: callMerchantService[index].status,
          };
        }
        result.assigned_store = listStore;
      }
      return result;
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

  /**
   * SOFT DELETES
   * @param id
   * @returns
   */
  async deleteVoucherPos(id) {
    try {
      const query = await this.voucherPosRepo
        .createQueryBuilder('loyalties_voucher_pos')
        .where('id = :id', { id: id })
        .getOne();

      // return error if data is not found
      if (!query) {
        return this.responseService.error(HttpStatus.BAD_REQUEST, {
          value: id,
          property: 'id',
          constraint: [this.messageService.get('general.general.dataNotFound')],
        });
      }

      // SOFT DELETE voucher pos
      const result = await this.voucherPosRepo.softDelete({ id: id });
      return result;
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('general.delete.fail'),
              error.message,
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  /**
   *
   * @param id
   * @returns
   */
  async restoreVoucherPos(id) {
    try {
      const query = await this.voucherPosRepo
        .createQueryBuilder('loyalties_voucher_pos')
        .where('id = :id', { id: id })
        .withDeleted()
        .getOne();

      // return error if data is not found
      if (!query) {
        return this.responseService.error(HttpStatus.BAD_REQUEST, {
          value: id,
          property: 'id',
          constraint: [this.messageService.get('general.general.dataNotFound')],
        });
      }

      // Restore voucher pos
      const result = await this.voucherPosRepo.restore({ id: id });
      return result;
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('general.general.dataNotFound'),
              error.message,
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  /**
   *
   * @param id
   * @returns
   */
  async stopVoucherPos(id) {
    try {
      const query = await this.voucherPosRepo
        .createQueryBuilder('loyalties_voucher_pos')
        .where('id = :id', { id: id })
        .withDeleted()
        .getOne();

      // return error if data is not found
      if (!query) {
        return this.responseService.error(HttpStatus.BAD_REQUEST, {
          value: id,
          property: 'id',
          constraint: [this.messageService.get('general.general.dataNotFound')],
        });
      }

      // Stop voucher pos
      const result = await this.voucherPosRepo
        .createQueryBuilder()
        .update()
        .set({
          stopped_at: 'now()',
        })
        .where({ id: id })
        .execute();
      return result;
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('general.general.dataNotFound'),
              error.message,
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  /**
   *
   * @param id
   * @returns
   */
  async continueVoucherPos(id) {
    try {
      const query = await this.voucherPosRepo
        .createQueryBuilder('loyalties_voucher_pos')
        .where('id = :id', { id: id })
        .withDeleted()
        .getOne();

      // return error if data is not found
      if (!query) {
        return this.responseService.error(HttpStatus.BAD_REQUEST, {
          value: id,
          property: 'id',
          constraint: [this.messageService.get('general.general.dataNotFound')],
        });
      }

      // continue voucher pos
      const result = await this.voucherPosRepo
        .createQueryBuilder()
        .update()
        .set({
          stopped_at: null,
        })
        .where({ id: id })
        .execute();
      return result;
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('general.general.dataNotFound'),
              error.message,
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  /**
   *
   * @param store_ids
   * @returns
   */
  async callInternalMerchantsStores(store_ids: string[]) {
    // Communicate with merchants service
    try {
      const headerRequest = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const url = `${process.env.BASEURL_MERCHANTS_SERVICE}/api/v1/internal/merchants/stores/byids`;

      const targetStatus = await firstValueFrom(
        this.httpservice
          .post(url, { store_ids: store_ids }, headerRequest)
          .pipe(map((resp) => resp.data)),
      );
      return targetStatus;
    } catch (error) {
      throw error;
    }
  }

  /**
   * REDIS PROCESS
   * @param voucherPosStatus
   * @param createdVoucherPos
   */
  async createVoucherPosQueue(
    voucherPosStatus: string,
    createdVoucherPos: VoucherPosDocument,
  ) {
    if (voucherPosStatus === StatusVoucherPosGroup.SCHEDULED) {
      const payloadStart: CreateAutoStartVoucherPosDto = {
        voucher_pos_id: createdVoucherPos.id,
        delay: DateTimeUtils.nowToDatetimeMilis(createdVoucherPos.date_start),
      };
      await this.redisVoucherPosService.createAutoStartVoucherPosQueue(
        payloadStart,
      );
    }
    const payloadFinish: CreateAutoFinishVoucherPosDto = {
      voucher_pos_id: createdVoucherPos.id,
      delay: DateTimeUtils.nowToDatetimeMilis(createdVoucherPos.date_end),
    };
    await this.redisVoucherPosService.createAutoFinishVoucherPosQueue(
      payloadFinish,
    );
  }

  /**
   * REDIS PROCESS
   * @param data
   * @returns
   */
  async updateVoucherPosStatusActive(
    data: UpdateVoucherPosStatusActiveDto,
  ): Promise<VoucherPosDocument> {
    try {
      const findVoucherCode = await this.voucherPosRepo.findOneOrFail({
        where: { id: data.voucher_pos_id },
      });

      if (findVoucherCode.status !== StatusVoucherPosGroup.SCHEDULED) {
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

      findVoucherCode.status = StatusVoucherPosGroup.ACTIVE;

      const updatedVoucherCode = await this.voucherPosRepo.save(
        findVoucherCode,
      );
      return updatedVoucherCode;
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

  /**
   * REDIS PROCESS
   * @param data
   * @returns
   */
  async updateVoucherPosStatusFinished(
    data: UpdateVoucherPosStatusFinishDto,
  ): Promise<VoucherPosDocument> {
    try {
      const findVoucherCode = await this.voucherPosRepo.findOneOrFail({
        where: { id: data.voucher_pos_id },
      });

      if (findVoucherCode.status !== StatusVoucherPosGroup.ACTIVE) {
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

      findVoucherCode.status = StatusVoucherPosGroup.FINISHED;

      const updatedVoucherCode = await this.voucherPosRepo.save(
        findVoucherCode,
      );
      return updatedVoucherCode;
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
