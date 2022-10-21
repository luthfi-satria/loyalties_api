import { HttpModule } from '@nestjs/axios';
import { forwardRef, Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { VoucherCodeModule } from 'src/voucher_code/voucher_code.module';
import {
  VoucherPosRepository,
  VoucherPosStoreRepository,
} from './repository/voucher-pos.repository';
import { VoucherPosController } from './voucher-pos.controller';
import { VoucherPosService } from './voucher-pos.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([VoucherPosRepository, VoucherPosStoreRepository]),
    forwardRef(() => CommonModule),
    VoucherCodeModule,
    HttpModule,
  ],
  controllers: [VoucherPosController],
  providers: [VoucherPosService, MessageService, ResponseService, Logger],
  exports: [TypeOrmModule, VoucherPosService],
})
export class VoucherPosModule {}
