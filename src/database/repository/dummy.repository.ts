import { EntityRepository, Repository } from 'typeorm';
import { DummyDocumentSix } from '../entities/dummy.entity';

@EntityRepository(DummyDocumentSix)
export class DummyRepositorySix extends Repository<DummyDocumentSix> {
  constructor() {
    super();
  }
}
