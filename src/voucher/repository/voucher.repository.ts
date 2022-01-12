import { EntityRepository, Repository } from 'typeorm';
import { VoucherDocument } from '../entities/voucher.entity';

@EntityRepository(VoucherDocument)
export class VouchersRepository extends Repository<VoucherDocument> {
  constructor() {
    super();
  }
}
