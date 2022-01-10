import { forwardRef, Logger, Module } from '@nestjs/common';
import { MasterVoucherService } from './master_voucher.service';
import { MasterVoucherController } from './master_voucher.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CommonModule } from 'src/common/common.module';
import { MasterVouchersRepository } from './repository/master_voucher.repository';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from 'src/database/database.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseService,
    }),
    TypeOrmModule.forFeature([MasterVouchersRepository]),
    forwardRef(() => CommonModule),
  ],
  controllers: [MasterVoucherController],
  providers: [MasterVoucherService, MessageService, ResponseService, Logger],
  exports: [TypeOrmModule, MasterVoucherService],
})
export class MasterVoucherModule {}
