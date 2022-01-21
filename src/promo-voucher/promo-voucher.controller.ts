import { Controller, Get, Param } from '@nestjs/common';
import { AuthJwtGuard, GetUser } from 'src/auth/auth.decorators';
import { User } from 'src/auth/guard/interface/user.interface';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { GetPromoStoreDto } from './dto/get-promo-store.dto';
import { PromoVoucherService } from './promo-voucher.service';

@Controller('api/v1/loyalties')
export class PromoVoucherController {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly promoVoucherService: PromoVoucherService,
  ) {}

  @Get('promos-vouchers/:merchant_id/:store_id/as-customer')
  @UserType('customer')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getAvailablePromoStoreCustomer(
    @Param('merchant_id') merchant_id: string,
    @Param('store_id') store_id: string,
    @GetUser() user: User,
  ) {
    try {
      const data: GetPromoStoreDto = {
        merchant_id,
        store_id,
        customer: user,
      };
      const result = await this.promoVoucherService.getAvailablePromoStore(
        data,
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

  @Get('promos-vouchers/:merchant_id/:store_id')
  @ResponseStatusCode()
  async getAvailablePromoStore(
    @Param('merchant_id') merchant_id: string,
    @Param('store_id') store_id: string,
  ) {
    try {
      const data: GetPromoStoreDto = {
        merchant_id,
        store_id,
      };
      const result = await this.promoVoucherService.getAvailablePromoStore(
        data,
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
}
