import { MasterVoucherVoucherCodeDocument } from './../entities/master_voucher_voucher_code.entity';
import { EntityRepository, Repository } from 'typeorm';

@EntityRepository(MasterVoucherVoucherCodeDocument)
export class MasterVoucherVoucherCodeRepository extends Repository<MasterVoucherVoucherCodeDocument> {
  constructor() {
    super();
  }
}
