import { EntityRepository, Repository } from 'typeorm';
import { DummyDocument } from '../entities/dummy.entity';

@EntityRepository(DummyDocument)
export class DummyRepository extends Repository<DummyDocument> {
  constructor() {
    super();
  }
}
