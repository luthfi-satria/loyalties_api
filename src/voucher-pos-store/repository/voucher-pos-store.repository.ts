import { VoucherPosStoreDocument } from 'src/voucher-pos/entities/voucher-pos.entity';
import { EntityRepository, Repository } from 'typeorm';

@EntityRepository(VoucherPosStoreDocument)
export class VoucherPosStoreRepository extends Repository<VoucherPosStoreDocument> {
  constructor() {
    super();
  }
}