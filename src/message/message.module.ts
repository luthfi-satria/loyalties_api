import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessageService } from '../message/message.service';

@Global()
@Module({
  providers: [
    {
      provide: 'MessageService',
      useClass: MessageService,
    },
  ],
  exports: [MessageService],
  imports: [ConfigModule.forRoot()],
})
export class MessageModule {}
