import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsDocument } from 'src/settings/entities/settings.entity';
import { SettingsRepository } from 'src/settings/repository/settings.repository';
import { SettingsSeederService } from './settings.service';

/**
 * Import and provide seeder classes for countrys.
 *
 * @module
 */
@Module({
  imports: [TypeOrmModule.forFeature([SettingsDocument, SettingsRepository])],
  providers: [SettingsSeederService, Logger],
  exports: [SettingsSeederService],
})
export class SettingsSeederModule {}
