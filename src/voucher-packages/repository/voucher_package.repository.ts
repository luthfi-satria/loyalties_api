import { EntityRepository, Repository } from 'typeorm';
import { VoucherPackageDocument } from '../entities/voucher-package.entity';

@EntityRepository(VoucherPackageDocument)
export class VoucherPackagesRepository extends Repository<VoucherPackageDocument> {
  constructor() {
    super();
  }
}
