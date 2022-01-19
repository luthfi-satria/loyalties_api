import { EntityRepository, Repository } from 'typeorm';
import { PromoBrandDocument } from '../entities/promo-brand.entity';

@EntityRepository(PromoBrandDocument)
export class PromoBrandRepository extends Repository<PromoBrandDocument> {
  constructor() {
    super();
  }
}
