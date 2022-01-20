import { Controller } from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { PromoBrandUsageService } from './promo-brand-usage.service';

@Controller('api/v1/loyalties')
export class PromoBrandUsageController {
  constructor(
    private readonly promoBrandService: PromoBrandUsageService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}
}
