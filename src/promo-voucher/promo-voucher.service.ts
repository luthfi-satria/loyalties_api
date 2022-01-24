import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { GetCustomerTargetLoyaltiesDto } from 'src/common/order/dto/get-customer-target-loyalty.dto';
import { OrderService } from 'src/common/order/order.service';
import { MessageService } from 'src/message/message.service';
import { PromoBrandService } from 'src/promo-brand/promo-brand.service';
import { PromoProviderService } from 'src/promo-provider/promo-provider.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { VoucherService } from 'src/voucher/voucher.service';
import { GetPromoStoreDto } from './dto/get-promo-store.dto';

@Injectable()
export class PromoVoucherService {
  constructor(
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly orderService: OrderService,
    private readonly promoProviderService: PromoProviderService,
    private readonly promoBrandService: PromoBrandService,
    private readonly voucherService: VoucherService,
  ) {}

  private readonly logger = new Logger(PromoVoucherService.name);

  async getAvailablePromoStore(data: GetPromoStoreDto) {
    try {
      //   const storeId = data.store_id;
      const merchantId = data.merchant_id;
      const customer = data.customer || null;
      const target = customer
        ? await this.getCostumerTargetLoyalties({
            customer_id: customer.id,
            created_at: customer.created_at,
          })
        : null;

      const promoProviders =
        await this.promoProviderService.getActivePromoProviders({
          target: target,
        });

      const promoBrands = await this.promoBrandService.getActivePromoBrands({
        target,
        merchant_id: merchantId,
      });

      const promos = [...promoBrands, ...promoProviders];
      let vouchers = [];

      if (customer) {
        const getVouchers = await this.voucherService.getActiveTargetVouchers({
          customer_id: customer.id,
          target: target,
        });

        vouchers = [...getVouchers];
      }

      return {
        promos,
        vouchers,
      };
    } catch (error) {
      this.errorReport(error, 'general.list.fail');
    }
  }

  //=> Utility services. Only Services called internally defined here.

  async getCostumerTargetLoyalties(
    data: GetCustomerTargetLoyaltiesDto,
  ): Promise<string> {
    try {
      if (!data.created_at || !data.customer_id) {
        return null;
      }

      const { data: response } =
        await this.orderService.getCostumerTargetLoyalties(data);

      return response?.target;
    } catch (error) {
      this.errorGenerator('', 'target', 'general.order.getTargetFail');
    }
  }

  errorReport(error: any, message: string) {
    this.logger.error(error);
    console.error(error);
    if (error.message == 'Bad Request Exception') {
      throw error;
    } else {
      const errors: RMessage = {
        value: '',
        property: '',
        constraint: [this.messageService.get(message), error.message],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
  }

  errorGenerator(value: string, property: string, constraint: string | any[]) {
    if (typeof constraint == 'string') {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value,
            property,
            constraint: [this.messageService.get(constraint)],
          },
          'Bad Request',
        ),
      );
    } else {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value,
            property,
            constraint: constraint,
          },
          'Bad Request',
        ),
      );
    }
  }
}
