import { EntityRepository, Repository } from 'typeorm';
import { PromoProviderDocument } from '../entities/promo-provider.entity';

@EntityRepository(PromoProviderDocument)
export class PromoProviderRepository extends Repository<PromoProviderDocument> {
  constructor() {
    super();
  }
}
