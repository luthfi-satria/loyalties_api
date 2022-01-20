import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromoProviderUsageRepository } from 'src/database/repository/promo-provider-usage.repository';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { PromoProviderUsageController } from './promo-provider-usage.controller';
import { PromoProviderUsageService } from './promo-provider-usage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PromoProviderUsageRepository]),
    ConfigModule,
    HttpModule,
  ],
  controllers: [PromoProviderUsageController],
  providers: [PromoProviderUsageService, MessageService, ResponseService],
  exports: [PromoProviderUsageService, TypeOrmModule],
})
export class PromoProviderUsageModule {}
