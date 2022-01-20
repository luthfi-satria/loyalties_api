import { EntityRepository, Repository } from 'typeorm';
import { VoucherPackageOrderDocument } from '../entities/voucher-packages-order.entity';

@EntityRepository(VoucherPackageOrderDocument)
export class VoucherPackageOrderRepository extends Repository<VoucherPackageOrderDocument> {
  constructor() {
    super();
  }
}
