import { MasterVoucherVoucherCodeRepository } from './../master_voucher_voucher_code/repository/master_voucher_voucher_code.repository';
import { MasterVouchersDocument } from 'src/master_vouchers/entities/master_voucher.entity';
import { VoucherService } from './../voucher/voucher.service';
import { MasterVoucherService } from './../master_vouchers/master_voucher.service';
import { RedisVoucherCodeService } from './../common/redis/voucher_code/redis-voucher_code.service';
import { VoucherCodesRepository } from './repository/voucher_code.repository';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Like } from 'typeorm';
import {
  CancelVoucherCodeDto,
  CreateVoucherCodeDto,
  CreateVoucherCodeToDbDto,
  StopVoucherCodeDto,
  UpdateVoucherCodeStatusActiveDto,
  UpdateVoucherCodeStatusFinishDto,
} from './dto/voucher_code.dto';
import {
  StatusVoucherCodeGroup,
  VoucherCodeDocument,
} from './entities/voucher_code.entity';
// import * as moment from 'moment';
import moment from 'moment';
import { DateTimeUtils } from 'src/utils/date-time-utils';
import {
  CreateAutoFinishVoucherCodeDto,
  CreateAutoStartVoucherCodeDto,
} from 'src/common/redis/dto/redis-voucher-code.dto';

@Injectable()
export class VoucherCodeService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly voucherCodesRepository: VoucherCodesRepository,
    private readonly redisVoucherCodeService: RedisVoucherCodeService,
    private readonly masterVoucherService: MasterVoucherService,
    private readonly voucherService: VoucherService,
    private readonly masterVoucherVoucherCodeRepository: MasterVoucherVoucherCodeRepository,
  ) {}
  private readonly logger = new Logger(VoucherCodeService.name);

  // CRUD
  async getListVoucherCode(data) {
    try {
      const page = data.page || 1;
      const limit = data.limit || 10;
      const offset = (page - 1) * limit;

      let qry = {};

      if (data.target) qry = { ...qry, target: data.target };
      if (data.status) qry = { ...qry, status: data.status };
      if (data.search) qry = { ...qry, code: Like(`%${data.search}%`) };

      const query = this.voucherCodesRepository
        .createQueryBuilder('vc')
        .leftJoinAndSelect('vc.vouchers', 'vouchers')
        .leftJoinAndSelect('vc.master_vouchers', 'master_vouchers')
        .leftJoinAndSelect(
          'vc.master_voucher_voucher_code',
          'master_voucher_voucher_code',
          'master_vouchers.id = master_voucher_voucher_code.loyaltiesMasterVoucherId',
        )
        .where(qry);

      const items = await query.getMany();
      const count = await query.getCount();

      // const [items, count] = await this.voucherCodesRepository.findAndCount({
      //   take: limit,
      //   skip: offset,
      //   where: qry,
      //   relations: ['vouchers', 'master_vouchers'],
      // });

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
  }

  async getVoucherCodeDetail(id) {
    try {
      return await this.voucherCodesRepository.findOneOrFail(id, {
        relations: ['vouchers', 'master_vouchers'],
      });
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

  async createVoucherCode(data: CreateVoucherCodeDto) {
    try {
      // const voucherCodes = await this.voucherCodesRepository.find({
      //   where: {
      //     status: Any(['ACTIVE', 'SCHEDULED']),
      //   },
      // });

      const gmt_offset = '7';
      const timeStart = new Date(`${data.date_start} +${gmt_offset}`);
      const timeEnd = new Date(`${data.date_end} +${gmt_offset}`);

      // this.checkVoucherCodeOverlap(voucherCodes, timeStart, timeEnd);

      this.checkVoucherCodeInPast(timeEnd);

      const now = new Date();

      const voucherCodeStatus =
        timeStart <= now
          ? StatusVoucherCodeGroup.ACTIVE
          : StatusVoucherCodeGroup.SCHEDULED;

      data.date_start = timeStart;
      data.date_end = timeEnd;
      data.status = voucherCodeStatus;

      const listVoucher = [];

      for (const voucher of data.master_vouchers) {
        if (!voucher.master_voucher_id) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              {
                value: voucher.master_voucher_id,
                property: 'master_voucher_id',
                constraint: [
                  this.messageService.get('catalog.general.id_notfound'),
                ],
              },
              'Bad Request',
            ),
          );
        }

        const cekMasterVoucherId = await this.masterVoucherService
          .getMasterVoucherDetail(voucher.master_voucher_id)
          .catch(() => {
            throw new BadRequestException(
              this.responseService.error(
                HttpStatus.BAD_REQUEST,
                {
                  value: voucher.master_voucher_id,
                  property: 'master_voucher_id',
                  constraint: [
                    this.messageService.get('catalog.general.id_notfound'),
                  ],
                },
                'Bad Request',
              ),
            );
          });
        listVoucher.push(cekMasterVoucherId);
      }

      const dataToDb: CreateVoucherCodeToDbDto = {
        ...data,
        master_vouchers: listVoucher,
      };

      const createdVoucher = await this.voucherCodesRepository.save(dataToDb);
      for (const voucher of data.master_vouchers) {
        const result = await this.masterVoucherVoucherCodeRepository.findOne({
          where: {
            loyaltiesMasterVoucherId: voucher.master_voucher_id,
            loyaltiesVoucherCodeId: createdVoucher.id,
          },
        });

        result.quantity = voucher.quantity;
        await this.masterVoucherVoucherCodeRepository.save(result);
      }
      await this.createVoucherCodeQueue(voucherCodeStatus, createdVoucher);

      if (data.is_prepopulated && data.quota) {
        const vouchers = [];
        for (let i = 0; i < listVoucher.length; i++) {
          const masterVoucher: MasterVouchersDocument = listVoucher[i];
          for (let j = 0; j < data.quota; j++) {
            const dataVoucher = {
              voucher_code_id: createdVoucher.id,
              customer_id: null,
              code: 'PROMO' + Math.floor(Math.random() * (100 - 1 + 1)) + 1,
              type: masterVoucher.type,
              order_type: masterVoucher.order_type,
              target: createdVoucher.target,
              date_start: null,
              date_end: null,
              minimum_transaction: masterVoucher.minimum_transaction,
              discount_type: masterVoucher.discount_type,
              discount_value: masterVoucher.discount_value,
              discount_maximum: masterVoucher.discount_maximum,
              is_combinable: masterVoucher.is_combinable,
            };
            vouchers.push(dataVoucher);
          }
        }
        await this.voucherService.createVoucherBulk(vouchers);
      }

      await this.redisVoucherCodeService.checkJobs();
      return createdVoucher;
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

  async cancelVoucherCode(data: CancelVoucherCodeDto) {
    try {
      const findVoucherCode = await this.voucherCodesRepository.findOneOrFail(
        data.id,
      );

      if (findVoucherCode.status != StatusVoucherCodeGroup.SCHEDULED) {
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

      findVoucherCode.cancellation_reason = data.cancellation_reason;
      findVoucherCode.status = StatusVoucherCodeGroup.CANCELLED;

      const updatedVoucherCode = await this.voucherCodesRepository.save(
        findVoucherCode,
      );

      await this.deleteVoucherCodeQueues(updatedVoucherCode.id);

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

  async stopVoucherCode(data: StopVoucherCodeDto) {
    try {
      const findVoucherCode = await this.voucherCodesRepository.findOneOrFail(
        data.id,
      );

      if (findVoucherCode.status != StatusVoucherCodeGroup.ACTIVE) {
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

      findVoucherCode.cancellation_reason = data.cancellation_reason;
      findVoucherCode.status = StatusVoucherCodeGroup.STOPPED;

      const updatedVoucherCode = await this.voucherCodesRepository.save(
        findVoucherCode,
      );

      await this.deleteVoucherCodeQueues(updatedVoucherCode.id);

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

  // MOMENT
  checkVoucherCodeOverlap(
    voucherCodes: VoucherCodeDocument[],
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
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [this.messageService.get('general.create.fail'), ''],
          },
          'Bad Request',
        ),
      );
    }
    if (voucherCodes.length > 0) {
      for (const voucherCode of voucherCodes) {
        const dbStart = moment(voucherCode.date_start).unix();
        const dbEnd = moment(voucherCode.date_end).unix();
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
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: '',
              property: '',
              constraint: [this.messageService.get('general.create.fail'), ''],
            },
            'Bad Request',
          ),
        );
      }
    }
  }

  checkVoucherCodeInPast(timeEnd: Date) {
    const now = new Date();

    if (now > timeEnd) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [this.messageService.get('general.create.fail'), ''],
          },
          'Bad Request',
        ),
      );
    }
  }

  // QUEUE
  async deleteVoucherCodeQueues(findVoucherCodeId: string) {
    await this.redisVoucherCodeService.deleteAutoStartVoucherCodeQueue({
      voucher_code_id: findVoucherCodeId,
    });

    await this.redisVoucherCodeService.deleteAutoFinishVoucherCodeQueue({
      voucher_code_id: findVoucherCodeId,
    });
  }

  async createVoucherCodeQueue(
    voucherCodeStatus: string,
    createdVoucherCode: VoucherCodeDocument,
  ) {
    if (voucherCodeStatus === StatusVoucherCodeGroup.SCHEDULED) {
      const payloadStart: CreateAutoStartVoucherCodeDto = {
        voucher_code_id: createdVoucherCode.id,
        delay: DateTimeUtils.nowToDatetimeMilis(createdVoucherCode.date_start),
      };
      await this.redisVoucherCodeService.createAutoStartVoucherCodeQueue(
        payloadStart,
      );
    }
    const payloadFinish: CreateAutoFinishVoucherCodeDto = {
      voucher_code_id: createdVoucherCode.id,
      delay: DateTimeUtils.nowToDatetimeMilis(createdVoucherCode.date_end),
    };
    await this.redisVoucherCodeService.createAutoFinishVoucherCodeQueue(
      payloadFinish,
    );
  }

  async updateVoucherCodeStatusActive(
    data: UpdateVoucherCodeStatusActiveDto,
  ): Promise<VoucherCodeDocument> {
    try {
      const findVoucherCode = await this.voucherCodesRepository.findOneOrFail({
        where: { id: data.voucher_code_id },
      });

      if (findVoucherCode.status !== StatusVoucherCodeGroup.SCHEDULED) {
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

      findVoucherCode.status = StatusVoucherCodeGroup.ACTIVE;

      const updatedVoucherCode = await this.voucherCodesRepository.save(
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

  async updateVoucherCodeStatusFinished(
    data: UpdateVoucherCodeStatusFinishDto,
  ): Promise<VoucherCodeDocument> {
    try {
      const findVoucherCode = await this.voucherCodesRepository.findOneOrFail({
        where: { id: data.voucher_code_id },
      });

      if (findVoucherCode.status !== StatusVoucherCodeGroup.ACTIVE) {
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

      findVoucherCode.status = StatusVoucherCodeGroup.FINISHED;

      const updatedVoucherCode = await this.voucherCodesRepository.save(
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
