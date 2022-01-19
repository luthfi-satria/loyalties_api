import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { BaseCreatePromoProviderDto } from './dto/create-promo-provider.dto';
import {
  DetailPromoProviderDto,
  ListPromoProviderDto,
} from './dto/list-promo-provider.dto';
import {
  CancellPromoProviderDto,
  StopPromoProviderDto,
  UpdatePromoProviderDto,
} from './dto/update-promo-provider.dto';
import { PromoProviderService } from './promo-provider.service';

@Controller('api/v1/loyalties')
export class PromoProviderController {
  constructor(
    private readonly promoProviderService: PromoProviderService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  @Post('provider-promos')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async createPromoProvider(@Body() data: BaseCreatePromoProviderDto) {
    try {
      const result = await this.promoProviderService.createPromoProvider(data);
      return this.responseService.success(
        true,
        this.messageService.get('general.general.success'),
        result,
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('provider-promos')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async listPromoProvider(@Query() data: ListPromoProviderDto) {
    try {
      const result = await this.promoProviderService.listPromoProvider(data);
      return this.responseService.success(
        true,
        this.messageService.get('general.general.success'),
        result,
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('provider-promos/:promo_id')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async detailPromoProvider(
    @Param('promo_id') promo_id: string,
    @Query() data: DetailPromoProviderDto,
  ) {
    try {
      data.promo_provider_id = promo_id;
      const result = await this.promoProviderService.detailPromoProvider(data);
      return this.responseService.success(
        true,
        this.messageService.get('general.general.success'),
        result,
      );
    } catch (error) {
      throw error;
    }
  }

  @Put('provider-promos/:promo_id')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updatePromoProvider(
    @Body() data: UpdatePromoProviderDto,
    @Param('promo_id') promo_id: string,
  ) {
    try {
      data.id = promo_id;
      const result = await this.promoProviderService.updatePromoProvider(data);
      return this.responseService.success(
        true,
        this.messageService.get('general.general.success'),
        result,
      );
    } catch (error) {
      throw error;
    }
  }

  @Put('provider-promos/:promo_id/cancelled')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async cancellPromoProvider(
    @Param('promo_id') promo_id: string,
    @Body() data: CancellPromoProviderDto,
  ) {
    data.promo_provider_id = promo_id;
    const result = await this.promoProviderService.cancellPromoProvider(data);
    return this.responseService.success(
      true,
      this.messageService.get('general.general.success'),
      result,
    );
  }

  @Put('provider-promos/:promo_id/stopped')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async stopPromoProvider(
    @Param('promo_id') promo_id: string,
    @Body() data: StopPromoProviderDto,
  ) {
    data.promo_provider_id = promo_id;
    const result = await this.promoProviderService.stopPromoProvider(data);
    return this.responseService.success(
      true,
      this.messageService.get('general.general.success'),
      result,
    );
  }
}
