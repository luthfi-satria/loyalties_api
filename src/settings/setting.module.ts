import { forwardRef, Logger, Module } from '@nestjs/common';
import { SettingService } from './setting.service';
import { SettingController } from './setting.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CommonModule } from 'src/common/common.module';
import { SettingsRepository } from './repository/settings.repository';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from 'src/database/database.service';
import { Seeder } from './seeders/seeder';
import { SettingsSeederModule } from './seeders/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseService,
    }),
    TypeOrmModule.forFeature([SettingsRepository]),
    forwardRef(() => CommonModule),
    SettingsSeederModule,
  ],
  controllers: [SettingController],
  providers: [SettingService, MessageService, ResponseService, Seeder, Logger],
  exports: [TypeOrmModule, SettingService],
})
export class SettingModule {}
