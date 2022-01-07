import { EntityRepository, Repository } from 'typeorm';
import { VouchersDocument } from '../entities/voucher.entity';

@EntityRepository(VouchersDocument)
export class VouchersRepository extends Repository<VouchersDocument> {
  constructor() {
    super();
  }
}
