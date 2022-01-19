import { Controller, Get, Param, Query } from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { GetPromoVouchersDto } from './dto/get-promo-vouchers.dto';
import { GetRecommendedPromosDto } from './dto/get-recommended-promos.dto';
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
  async getPromoVouchers(@Query() data: GetPromoVouchersDto) {
    try {
      const result = await this.internalService.getPromoVouchers(data);
      return this.responseService.success(
        true,
        this.messageService.get('general.general.success'),
        result,
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('recommended-promos/:merchant_id')
  @ResponseStatusCode()
  async getRecommendedPromos(
    @Query() data: GetRecommendedPromosDto,
    @Param('merchant_id') merchant_id: string,
  ) {
    try {
      data.merchant_id = merchant_id;
      const result = await this.internalService.getRecommendedPromos(data);
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
