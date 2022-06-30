import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { GetPromoVouchersDto } from './dto/get-promo-vouchers.dto';
import { GetRecommendedPromosDto } from './dto/get-recommended-promos.dto';
import { GetVoucherPackageBulkDto } from './dto/get-voucher-package.dto';
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

  @Post(':order_id/payment-success')
  @ResponseStatusCode()
  async orderVoucherPackageSuccess(
    @Param('order_id') order_id: string,
  ): Promise<any> {
    try {
      const result = await this.internalService.orderVoucherPackageSuccess({
        order_id,
      });
      return this.responseService.success(
        true,
        this.messageService.get('general.general.success'),
        result,
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Post(':order_id/payment-expired')
  @ResponseStatusCode()
  async orderVoucherPackageExpired(
    @Param('order_id') order_id: string,
  ): Promise<any> {
    try {
      const result = await this.internalService.orderVoucherPackageExpired({
        order_id,
      });
      return this.responseService.success(
        true,
        this.messageService.get('general.general.success'),
        result,
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Post('voucher-packages-bulk')
  @ResponseStatusCode()
  async getVoucherPackages(
    @Body() getVoucherPackageBulkDto: GetVoucherPackageBulkDto,
  ) {
    try {
      const result = await this.internalService.getVoucherPackagesBulk(
        getVoucherPackageBulkDto,
      );
      return this.responseService.success(
        true,
        this.messageService.get('general.general.success'),
        result,
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('voucher-package-order/:id')
  @ResponseStatusCode()
  async getVoucherPackageOrderById(@Param('id') id: string) {
    try {
      const result = await this.internalService.getVoucherPackageOrder(id);
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
