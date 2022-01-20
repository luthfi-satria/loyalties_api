import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromoBrandUsageRepository } from 'src/database/repository/promo-brand-usage.repository';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { PromoBrandUsageController } from './promo-brand-usage.controller';
import { PromoBrandUsageService } from './promo-brand-usage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PromoBrandUsageRepository]),
    ConfigModule,
    HttpModule,
  ],
  controllers: [PromoBrandUsageController],
  providers: [PromoBrandUsageService, MessageService, ResponseService],
  exports: [PromoBrandUsageService, TypeOrmModule],
})
export class PromoBrandUsageModule {}
