import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessageService } from 'src/message/message.service';
import { PromoProviderModule } from 'src/promo-provider/promo-provider.module';
import { ResponseService } from 'src/response/response.service';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';

@Module({
  imports: [ConfigModule, HttpModule, PromoProviderModule],
  controllers: [InternalController],
  providers: [InternalService, MessageService, ResponseService],
  exports: [InternalService],
})
export class InternalModule {}
