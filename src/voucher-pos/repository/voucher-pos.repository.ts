import { EntityRepository, Repository } from 'typeorm';
import {
  VoucherPosDocument,
  VoucherPosStoreDocument,
} from '../entities/voucher-pos.entity';

@EntityRepository(VoucherPosDocument)
export class VoucherPosRepository extends Repository<VoucherPosDocument> {
  constructor() {
    super();
  }
}

@EntityRepository(VoucherPosStoreDocument)
export class VoucherPosStoreRepository extends Repository<VoucherPosStoreDocument> {
  constructor() {
    super();
  }
}
