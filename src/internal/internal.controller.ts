import { Controller, Get, Query } from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { GetPromoProvidersDto } from './dto/get-promo-providers.dto';
import { InternalService } from './internal.service';

@Controller('api/v1/internal/loyalties')
export class InternalController {
  constructor(
    private readonly internalService: InternalService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  @Get('provider-promos')
  @ResponseStatusCode()
  async getPromoProviders(@Query() data: GetPromoProvidersDto) {
    try {
      const result = await this.internalService.getPromoProviders(data);
      return this.responseService.success(
        true,
        this.messageService.get('general.general.success'),
        result,
      );
    } catch (error) {
      throw error;
    }
  }
}
