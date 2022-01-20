import { EntityRepository, Repository } from 'typeorm';
import { PromoProviderUsageDocument } from '../entities/promo-provider-usage.entity';

@EntityRepository(PromoProviderUsageDocument)
export class PromoProviderUsageRepository extends Repository<PromoProviderUsageDocument> {
  constructor() {
    super();
  }
}
