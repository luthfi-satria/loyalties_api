import { EntityRepository, Repository } from 'typeorm';
import { PromoBrandUsageDocument } from '../entities/promo-brand-usage.entity';

@EntityRepository(PromoBrandUsageDocument)
export class PromoBrandUsageRepository extends Repository<PromoBrandUsageDocument> {
  constructor() {
    super();
  }
}
