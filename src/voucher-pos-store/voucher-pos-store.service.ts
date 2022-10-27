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
import { VoucherPosRepository } from 'src/voucher-pos/repository/voucher-pos.repository';
import { GetListVoucherPosStoreDto } from './dto/voucher-pos-store.dto';
import { VoucherPosStoreRepository } from './repository/voucher-pos-store.repository';

@Injectable()
export class VoucherPosStoreService {
  constructor(
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly voucherPosRepo: VoucherPosRepository,
    private readonly voucherPosStoreRepo: VoucherPosStoreRepository,
    private readonly httpservice: HttpService,
  ) {}

  private readonly logger = new Logger(VoucherPosStoreService.name);

  /**
   *
   * @param data
   * @returns
   */
  async getListStoreByVoucherPosId(id, data: GetListVoucherPosStoreDto) {
    try {
      // get detail voucher pos
      const voucherPosDetail = await this.voucherPosRepo.findOneOrFail({
        id: id,
      });

      // get list assigned stores
      const listStores = await this.getListStoresByVoucherPosId(id);

      const reqData = {
        page: data.page,
        limit: data.limit,
        merchant_id: voucherPosDetail.brand_id,
        store_id: listStores,
        search: data?.search ? data.search : '',
        status: data.status ? data.status : '',
        target:
          typeof data.target != 'undefined' && data.target != ''
            ? data.target
            : null,
      };

      if (
        typeof data.target != 'undefined' &&
        data.target == 'assigned' &&
        listStores.length == 0
      ) {
        return listStores;
      }

      // call api to merchant services
      const result = await this.callInternalMerchantsStores(reqData);
      return result;
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: 'status',
            property: 'status',
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
   *
   * @param data
   * @returns
   */
  async assignVoucherToStore(data) {
    try {
      const bulkInsert = [];
      if (data.store_id.length > 0) {
        // assign list of store into data objects
        for (const storeId of data.store_id) {
          bulkInsert.push({
            voucher_pos_id: data.voucher_pos_id,
            store_id: storeId,
          });
        }

        // insert data objects into database
        const query = await this.voucherPosStoreRepo
          .createQueryBuilder()
          .insert()
          .into('loyalties_voucher_pos_store')
          .values(bulkInsert)
          .execute();

        return query.raw;
      }
    } catch (error) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: 'status',
            property: 'status',
            constraint: [
              this.messageService.get('general.insert.fail'),
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
   * @param data
   * @returns
   */
  async unassignVoucherFromStore(data) {
    try {
      const query = await this.voucherPosStoreRepo
        .createQueryBuilder()
        .delete()
        .from('loyalties_voucher_pos_store')
        .where('voucher_pos_id = :voucher_pos_id', {
          voucher_pos_id: data.voucher_pos_id,
        })
        .andWhere('store_id IN (:...ids)', { ids: data.store_id })
        .execute();

      return query;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getListStoresByVoucherPosId(voucher_pos_id: string) {
    // get list stores
    const query = await this.voucherPosStoreRepo
      .createQueryBuilder('vps')
      .where('voucher_pos_id = :voucher_pos_id', {
        voucher_pos_id: voucher_pos_id,
      });

    const result = await query.withDeleted().getMany();

    const listStores = [];

    if (result.length > 0) {
      result.forEach((res) => {
        listStores.push(res.store_id);
      });
    }

    // this.logger.warn(listStores);
    return listStores;
  }

  async callInternalMerchantsStores(data) {
    // Communicate with merchants service
    try {
      const headerRequest = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const url = `${process.env.BASEURL_MERCHANTS_SERVICE}/api/v1/internal/merchants/stores/multi-criteria`;

      const targetStatus = await firstValueFrom(
        this.httpservice
          .post(url, data, headerRequest)
          .pipe(map((resp) => resp.data)),
      );
      return targetStatus;
    } catch (error) {
      throw error;
    }
  }
}
