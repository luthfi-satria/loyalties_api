import { VoucherCodeDocument } from './../entities/voucher_code.entity';
import { EntityRepository, Repository } from 'typeorm';

@EntityRepository(VoucherCodeDocument)
export class VoucherCodesRepository extends Repository<VoucherCodeDocument> {
  constructor() {
    super();
  }
}
