import { Controller } from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { PromoProviderUsageService } from './promo-provider-usage.service';

@Controller('api/v1/loyalties')
export class PromoProviderUsageController {
  constructor(
    private readonly promoProviderService: PromoProviderUsageService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}
}
