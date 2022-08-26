import { EntityRepository, Repository } from 'typeorm';
import {
  VoucherPosStoreDocument,
} from '../entities/voucher-pos-store.entity';

@EntityRepository(VoucherPosStoreDocument)
export class VoucherPosStoreRepository extends Repository<VoucherPosStoreDocument> {
  constructor() {
    super();
  }
}
