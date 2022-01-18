import { Logger } from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { FetchMasterVoucherVoucherCodesDto } from './dto/get_master_voucher_voucher_code.dto';
import { MasterVoucherVoucherCodeDocument } from './entities/master_voucher_voucher_code.entity';
import { MasterVoucherVoucherCodeRepository } from './repository/master_voucher_voucher_code.repository';

export class MasterVoucherVoucherCodeService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly masterVoucherVoucherCodeRepository: MasterVoucherVoucherCodeRepository,
  ) {}
  private readonly logger = new Logger(MasterVoucherVoucherCodeService.name);

  async fetchMasterVoucherVoucherCodes(
    data: FetchMasterVoucherVoucherCodesDto,
  ): Promise<MasterVoucherVoucherCodeDocument[]> {
    try {
      const loyaltiesMasterVoucherId = data.loyaltiesMasterVoucherId || null;
      const loyaltiesVoucherCodeId = data.loyaltiesVoucherCodeId || null;
      console.log(this.masterVoucherVoucherCodeRepository, 'exis?');
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
}
