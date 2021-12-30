import { Controller, Logger } from '@nestjs/common';

@Controller('')
export class NatsController {
  logger = new Logger(NatsController.name);
}
