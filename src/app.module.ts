import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseService } from './database/database.service';
import { PromoProviderModule } from './promo-provider/promo-provider.module';
import { SettingModule } from './settings/setting.module';
import { VoucherModule } from './vouchers/voucher.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseService,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: +process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
      },
    }),
    SettingModule,
    VoucherModule,
    AuthModule,
    PromoProviderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
