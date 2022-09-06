import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { VoucherCodeService } from 'src/voucher_code/voucher_code.service';
import { ILike, LessThan, MoreThan } from 'typeorm';
import {
  CreateVoucherPosDto,
  UpdateVoucherPosDto,
} from './dto/voucher-pos.dto';
import { StatusVoucherPosGroup } from './entities/voucher-pos.entity';
import { VoucherPosRepository } from './repository/voucher-pos.repository';

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
  ) {}

  private readonly logger = new Logger(VoucherPosService.name);

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

      if (data.brand_id) qry = { ...qry, brand_id: data.brand_id };
      if (data.status) qry = { ...qry, status: data.status };
      if (data.search) qry = { ...qry, code: ILike(`%${data.search}%`) };
      if (data.date_start)
        qry = { ...qry, date_start: MoreThan(data.date_start) };
      if (data.date_end) qry = { ...qry, date_end: LessThan(data.date_end) };

      const query = this.voucherPosRepo
        .createQueryBuilder('vp')
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

      if (typeof data.store_id != 'undefined' && data.store_id != '') {
        query.andWhere('vps.store_id = :store_id', { store_id: data.store_id });
      }

      // this.logger.warn(query.getQuery());
      const items = await query.getMany();
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

    const now = new Date();

    // voucher status
    const status = !data.status
      ? timeStart <= now
        ? StatusVoucherPosGroup.ACTIVE
        : StatusVoucherPosGroup.SCHEDULED
      : data.status;

    data.date_start = timeStart;
    data.date_end = timeEnd;
    data.status = status;

    const createdVoucher = await this.voucherPosRepo
      .createQueryBuilder()
      .insert()
      .into('loyalties_voucher_pos')
      .values(data)
      .execute();

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

        // compare date_start & date_end
        this.voucherCodeService.checkVoucherCodeInPast(timeEnd);

        const now = new Date();

        // voucher status
        const status = !data.status
          ? timeStart <= now
            ? StatusVoucherPosGroup.ACTIVE
            : StatusVoucherPosGroup.SCHEDULED
          : data.status;

        data.date_start = timeStart;
        data.date_end = timeEnd;
        data.status = status;

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
      // const result = await this.voucherPosRepo.findOneOrFail({ id: id });
      const result = await this.voucherPosRepo
        .createQueryBuilder('vp')
        .addSelect('assigned_store.store_id')
        .leftJoin('vp.assigned_store', 'assigned_store')
        .where({ id: id })
        .getOneOrFail();

      if (result) {
        const store_ids = [];
        const assigned_store = result.assigned_store;
        for (let index = 0; index < assigned_store.length; index++) {
          store_ids.push(assigned_store[index].store_id);
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
}
