import { CommonStorageService } from 'src/common/storage/storage.service';
import ExcelJS from 'exceljs';
import { MasterVoucherVoucherCodeRepository } from './../master_voucher_voucher_code/repository/master_voucher_voucher_code.repository';
import { MasterVouchersDocument } from 'src/master_vouchers/entities/master_voucher.entity';
import { VoucherService } from './../voucher/voucher.service';
import { MasterVoucherService } from './../master_vouchers/master_voucher.service';
import { RedisVoucherCodeService } from './../common/redis/voucher_code/redis-voucher_code.service';
import { VoucherCodesRepository } from './repository/voucher_code.repository';
import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { ILike, LessThan, MoreThan } from 'typeorm';
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
import { VoucherDocument } from 'src/voucher/entities/voucher.entity';

@Injectable()
export class VoucherCodeService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly voucherCodesRepository: VoucherCodesRepository,
    private readonly redisVoucherCodeService: RedisVoucherCodeService,
    private readonly masterVoucherService: MasterVoucherService,
    @Inject(forwardRef(() => VoucherService))
    private readonly voucherService: VoucherService,
    private readonly masterVoucherVoucherCodeRepository: MasterVoucherVoucherCodeRepository,
    private readonly storage: CommonStorageService,
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
      if (data.search) qry = { ...qry, code: ILike(`%${data.search}%`) };
      if (data.periode_start)
        qry = { ...qry, date_start: MoreThan(data.periode_start) };
      if (data.periode_end)
        qry = { ...qry, date_end: LessThan(data.periode_end) };

      const query = this.voucherCodesRepository
        .createQueryBuilder('vc')
        .leftJoinAndSelect('vc.vouchers', 'vouchers')
        // .leftJoinAndSelect('vc.master_vouchers', 'master_vouchers')
        .leftJoinAndSelect(
          'vc.master_voucher_voucher_code',
          'master_voucher_voucher_code',
          'vc.id = master_voucher_voucher_code.loyaltiesVoucherCodeId',
        )
        .leftJoinAndSelect(
          'master_voucher_voucher_code.master_voucher',
          'master_voucher',
        )
        .where(qry)
        .orderBy('vc.created_at', 'DESC')
        .take(limit)
        .skip(offset);

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
      const query = this.voucherCodesRepository
        .createQueryBuilder('vc')
        .leftJoinAndSelect('vc.vouchers', 'vouchers')
        // .leftJoinAndSelect('vc.master_vouchers', 'master_vouchers')
        .leftJoinAndSelect(
          'vc.master_voucher_voucher_code',
          'master_voucher_voucher_code',
          'vc.id = master_voucher_voucher_code.loyaltiesVoucherCodeId',
        )
        .leftJoinAndSelect(
          'master_voucher_voucher_code.master_voucher',
          'master_voucher',
        )
        .where(id);
      return query.getOneOrFail();
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

  async generateUniqueCode(len, code) {
    var arr = [];
    while (arr.length < len) {
      var r = code + Math.floor(Math.random() * 100) + 1;
      if (arr.indexOf(r) === -1) arr.push(r);
    }
    return arr;
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
        code: data.code,
        date_end: data.date_end,
        date_start: data.date_start,
        is_prepopulated: data.is_prepopulated,
        quota: data.quota,
        status: data.status,
        target: data.target,
        // master_vouchers: listVoucher,
      };

      const createdVoucher = await this.voucherCodesRepository.save(dataToDb);
      for (const voucher of data.master_vouchers) {
        const result = await this.masterVoucherVoucherCodeRepository.findOne({
          where: {
            loyaltiesMasterVoucherId: voucher.master_voucher_id,
            loyaltiesVoucherCodeId: createdVoucher.id,
          },
        });
        if (!result) {
          const postDataMvvc = {
            loyaltiesMasterVoucherId: voucher.master_voucher_id,
            loyaltiesVoucherCodeId: createdVoucher.id,
            quantity: voucher.quantity,
          };
          await this.masterVoucherVoucherCodeRepository.save(postDataMvvc);
        }
      }
      await this.createVoucherCodeQueue(voucherCodeStatus, createdVoucher);

      if (data.is_prepopulated && data.quota) {
        const uniqueCodes = await this.generateUniqueCode(
          // data.quota,
          listVoucher.length * data.quota,
          createdVoucher.code,
        );
        let indexUniqueCodes = 0;
        const vouchers = [];
        for (let i = 0; i < listVoucher.length; i++) {
          const masterVoucher: MasterVouchersDocument = listVoucher[i];
          for (let j = 0; j < data.quota; j++) {
            const dataVoucher = {
              voucher_code_id: createdVoucher.id,
              master_voucher_id: masterVoucher.id,
              customer_id: null,
              code: uniqueCodes[indexUniqueCodes],
              // createdVoucher.code +
              // Math.floor(Math.random() * (100 - 1 + 1)) +
              // 1,
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
            indexUniqueCodes++;
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

      if (
        findVoucherCode.status != StatusVoucherCodeGroup.ACTIVE &&
        !data.isBypassValidation
      ) {
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

      if (
        data.isBypassValidation &&
        findVoucherCode.status != StatusVoucherCodeGroup.ACTIVE
      ) {
        return null;
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

  async exportExcel(id) {
    const voucher_codes: VoucherCodeDocument = await this.getVoucherCodeDetail(
      id,
    );
    let url = null;

    if (voucher_codes.excel_file) {
      url = voucher_codes.excel_file;
    } else {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Efood';
      const sheetVoucherCode = workbook.addWorksheet('Voucher Code', {
        properties: { defaultColWidth: 20 },
      });

      sheetVoucherCode.columns = [
        // { header: 'Id', key: 'id', width: 10 },
        { header: 'Kode Unik', key: 'code', width: 32 },
      ];

      for (let i = 0; i < voucher_codes.vouchers.length; i++) {
        const voucher: VoucherDocument = voucher_codes.vouchers[i];
        // sheetVoucherCode.getCell(`A${i + 2}`).value = voucher.id;
        sheetVoucherCode.getCell(`A${i + 2}`).value = voucher.code;
      }

      // const fileName: string = `voucher_codes_${id.id}.xlsx`;
      const fileName = `voucher_codes_${id.id}.xlsx`;
      await workbook.xlsx.writeFile(fileName);
      url = await this.storage.store(fileName);
      voucher_codes.excel_file = url;
      await this.voucherCodesRepository.save(voucher_codes);
    }

    return { url };
  }
}
