import { forwardRef, Module } from '@nestjs/common';
import { PromoProviderService } from './promo-provider.service';
import { PromoProviderController } from './promo-provider.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PromoProviderRepository } from 'src/database/repository/promo-provider.repository';
import { CommonModule } from 'src/common/common.module';
import { DummyRepositorySix } from 'src/database/repository/dummy.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([PromoProviderRepository, DummyRepositorySix]),
    ConfigModule,
    HttpModule,
    forwardRef(() => CommonModule),
  ],
  controllers: [PromoProviderController],
  providers: [PromoProviderService, MessageService, ResponseService],
  exports: [PromoProviderService, TypeOrmModule],
})
export class PromoProviderModule {}
