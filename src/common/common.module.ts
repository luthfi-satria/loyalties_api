import { DriverType, StorageModule } from '@codebrew/nestjs-storage';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { Global, Module } from '@nestjs/common';
import { NatsController } from './nats/nats.controller';

@Global()
@Module({
  imports: [
    StorageModule.forRoot({
      default: process.env.STORAGE_S3_STORAGE || 'local',
      disks: {
        local: {
          driver: DriverType.LOCAL,
          config: {
            root: process.cwd(),
          },
        },
        s3: {
          driver: DriverType.S3,
          config: {
            key: process.env.STORAGE_S3_KEY || '',
            secret: process.env.STORAGE_S3_SECRET || '',
            bucket: process.env.STORAGE_S3_BUCKET || '',
            region: process.env.STORAGE_S3_REGION || '',
          },
        },
      },
    }),
    BullModule.registerQueue({
      name: 'orders',
    }),
    HttpModule,
  ],
  providers: [],
  exports: [],
  controllers: [NatsController],
})
export class CommonModule {}
