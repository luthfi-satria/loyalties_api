import { EntityRepository, Repository } from 'typeorm';
import { VoucherPackagesMasterVouchersDocument } from '../entities/voucher-package-master-voucher.entity';

@EntityRepository(VoucherPackagesMasterVouchersDocument)
export class VoucherPackagesMasterVouchersRepository extends Repository<VoucherPackagesMasterVouchersDocument> {
  constructor() {
    super();
  }
}
