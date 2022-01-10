import { EntityRepository, Repository } from 'typeorm';
import { MasterVouchersDocument } from '../entities/master_voucher.entity';

@EntityRepository(MasterVouchersDocument)
export class MasterVouchersRepository extends Repository<MasterVouchersDocument> {
  constructor() {
    super();
  }
}
