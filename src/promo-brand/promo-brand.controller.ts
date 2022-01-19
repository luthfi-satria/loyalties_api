import { Controller, Post, Body, Get, Query, Param, Put } from '@nestjs/common';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { BaseCreatePromoBrandDto } from './dto/create-promo-brand.dto';
import {
  ListPromoBrandDto,
  DetailPromoBrandDto,
} from './dto/list-promo-brand.dto';
import {
  UpdatePromoBrandDto,
  CancellPromoBrandDto,
  StopPromoBrandDto,
} from './dto/update-promo-brand.dto';
import { PromoBrandService } from './promo-brand.service';

@Controller('api/v1/loyalties')
export class PromoBrandController {
  constructor(
    private readonly promoBrandService: PromoBrandService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  @Post('brand-promos/:merchant_id')
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async createPromoBrand(
    @Param('merchant_id') merchant_id: string,
    @Body() data: BaseCreatePromoBrandDto,
  ) {
    try {
      data.merchant_id = merchant_id;
      const result = await this.promoBrandService.createPromoBrand(data);
      return this.responseService.success(
        true,
        this.messageService.get('general.general.success'),
        result,
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('brand-promos/:merchant_id')
  @UserTypeAndLevel(
    'admin.*',
    'merchant.group',
    'merchant.merchant',
    'merchant.store',
  )
  @AuthJwtGuard()
  @ResponseStatusCode()
  async listPromoBrand(
    @Param('merchant_id') merchant_id: string,
    @Query() data: ListPromoBrandDto,
  ) {
    try {
      data.merchant_id = merchant_id;
      const result = await this.promoBrandService.listPromoBrand(data);
      return this.responseService.success(
        true,
        this.messageService.get('general.general.success'),
        result,
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('brand-promos/:merchant_id/:promo_id')
  @UserTypeAndLevel(
    'admin.*',
    'merchant.group',
    'merchant.merchant',
    'merchant.store',
  )
  @AuthJwtGuard()
  @ResponseStatusCode()
  async detailPromoBrand(
    @Param('merchant_id') merchant_id: string,
    @Param('promo_id') promo_id: string,
    @Query() data: DetailPromoBrandDto,
  ) {
    try {
      data.merchant_id = merchant_id;
      data.promo_brand_id = promo_id;
      const result = await this.promoBrandService.detailPromoBrand(data);
      return this.responseService.success(
        true,
        this.messageService.get('general.general.success'),
        result,
      );
    } catch (error) {
      throw error;
    }
  }

  @Put('brand-promos/:merchant_id/:promo_id')
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updatePromoBrand(
    @Body() data: UpdatePromoBrandDto,
    @Param('merchant_id') merchant_id: string,
    @Param('promo_id') promo_id: string,
  ) {
    try {
      data.merchant_id = merchant_id;
      data.id = promo_id;
      const result = await this.promoBrandService.updatePromoBrand(data);
      return this.responseService.success(
        true,
        this.messageService.get('general.general.success'),
        result,
      );
    } catch (error) {
      throw error;
    }
  }

  @Put('brand-promos/:merchant_id/:promo_id/cancelled')
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async cancellPromoBrand(
    @Param('merchant_id') merchant_id: string,
    @Param('promo_id') promo_id: string,
    @Body() data: CancellPromoBrandDto,
  ) {
    data.merchant_id = merchant_id;
    data.promo_brand_id = promo_id;
    const result = await this.promoBrandService.cancellPromoBrand(data);
    return this.responseService.success(
      true,
      this.messageService.get('general.general.success'),
      result,
    );
  }

  @Put('brand-promos/:merchant_id/:promo_id/stopped')
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async stopPromoBrand(
    @Param('merchant_id') merchant_id: string,
    @Param('promo_id') promo_id: string,
    @Body() data: StopPromoBrandDto,
  ) {
    data.merchant_id = merchant_id;
    data.promo_brand_id = promo_id;
    const result = await this.promoBrandService.stopPromoBrand(data);
    return this.responseService.success(
      true,
      this.messageService.get('general.general.success'),
      result,
    );
  }
}
