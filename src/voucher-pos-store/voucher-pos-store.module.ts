import { HttpModule } from '@nestjs/axios';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { VoucherPosModule } from 'src/voucher-pos/voucher-pos.module';
import { VoucherCodeModule } from 'src/voucher_code/voucher_code.module';
import { VoucherPosStoreRepository } from './repository/voucher-pos-store.repository';
import { VoucherPosStoreController } from './voucher-pos-store.controller';
import { VoucherPosStoreService } from './voucher-pos-store.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([VoucherPosStoreRepository]),
    VoucherCodeModule,
    VoucherPosModule,
    HttpModule,
  ],
  controllers: [VoucherPosStoreController],
  providers: [VoucherPosStoreService, MessageService, ResponseService, Logger],
  exports: [TypeOrmModule, VoucherPosStoreService],
})
export class VoucherPosStoreModule {}
