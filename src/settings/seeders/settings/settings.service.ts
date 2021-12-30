import { Injectable, Logger } from '@nestjs/common';
import { SettingsDocument } from 'src/settings/entities/settings.entity';
import { SettingsRepository } from 'src/settings/repository/settings.repository';
import { settings } from './settings.data';

@Injectable()
export class SettingsSeederService {
  constructor(private readonly settingsRepository: SettingsRepository) {}
  async create(): Promise<Array<Promise<SettingsDocument>>> {
    const countData = await this.settingsRepository.count();
    if (countData) {
      Logger.verbose('Data seeder had been inserted');
      return null;
    }
    try {
      await this.settingsRepository.save(settings);
    } catch (error) {
      Logger.error(error);
    }
  }
}
