import { EntityRepository, Repository } from 'typeorm';
import { SettingsDocument } from '../entities/settings.entity';

@EntityRepository(SettingsDocument)
export class SettingsRepository extends Repository<SettingsDocument> {
  constructor() {
    super();
  }
}
