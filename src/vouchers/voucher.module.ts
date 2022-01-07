import { forwardRef, Logger, Module } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { VoucherController } from './voucher.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CommonModule } from 'src/common/common.module';
import { VouchersRepository } from './repository/voucher.repository';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from 'src/database/database.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([VouchersRepository]),
    forwardRef(() => CommonModule),
  ],
  controllers: [VoucherController],
  providers: [VoucherService, MessageService, ResponseService, Logger],
  exports: [TypeOrmModule, VoucherService],
})
export class VoucherModule {}
