import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { PromoBrandService } from 'src/promo-brand/promo-brand.service';
import { PromoProviderService } from 'src/promo-provider/promo-provider.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { VoucherPackagesCustomersService } from 'src/voucher-packages-customers/voucher-packages-customers.service';
import { VoucherPackagesService } from 'src/voucher-packages/voucher-packages.service';
import { VoucherPosService } from 'src/voucher-pos/voucher-pos.service';
import { GetPromoVouchersDto } from './dto/get-promo-vouchers.dto';
import { GetRecommendedPromosDto } from './dto/get-recommended-promos.dto';
import { GetVoucherPackageBulkDto } from './dto/get-voucher-package.dto';
import {
  CallBackOrderExpiredDto,
  CallBackOrderSuccessDto,
} from './dto/order-voucher-package.dto';

@Injectable()
export class InternalService {
  constructor(
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly promoProviderService: PromoProviderService,
    private readonly promoBrandService: PromoBrandService,
    private readonly voucherPackagesCustomersService: VoucherPackagesCustomersService,
    private readonly voucherPackagesService: VoucherPackagesService,
    private readonly voucherPosService: VoucherPosService,
  ) {}

  private readonly logger = new Logger(InternalService.name);

  async getVoucherPackageOrder(voucher_package_order_id: string) {
    try {
      return this.voucherPackagesCustomersService.getVoucherPackageById(
        voucher_package_order_id,
      );
    } catch (e) {
      throw e;
    }
  }

  async getVoucherPackageOrderBulk(voucher_package_order_ids: string[]) {
    try {
      return this.voucherPackagesCustomersService.getVoucherPackageBulk(
        voucher_package_order_ids,
      );
    } catch (error) {
      throw error;
    }
  }

  async getPromoVouchers(data: GetPromoVouchersDto): Promise<any> {
    try {
      return this.promoProviderService.getPromoVouchers(data);
    } catch (error) {
      this.errorReport(error, 'general.general.fail');
    }
  }

  async getRecommendedPromos(data: GetRecommendedPromosDto): Promise<any> {
    try {
      return this.promoBrandService.getRecommendedPromos(data);
    } catch (error) {
      this.errorReport(error, 'general.general.fail');
    }
  }

  async orderVoucherPackageSuccess(
    data: CallBackOrderSuccessDto,
  ): Promise<any> {
    try {
      return this.voucherPackagesCustomersService.orderVoucherPackageSuccess(
        data,
      );
    } catch (error) {
      this.errorReport(error, 'general.general.fail');
    }
  }

  async orderVoucherPackageExpired(
    data: CallBackOrderExpiredDto,
  ): Promise<any> {
    try {
      return this.voucherPackagesCustomersService.orderVoucherPackageExpired(
        data,
      );
    } catch (error) {
      this.errorReport(error, 'general.general.fail');
    }
  }

  async getVoucherPackagesBulk(
    getVoucherPackageBulkDto: GetVoucherPackageBulkDto,
  ) {
    try {
      const result = await this.voucherPackagesService.getDetailBulk(
        getVoucherPackageBulkDto.voucher_package_ids,
      );

      if (
        getVoucherPackageBulkDto.is_remove_voucher_package_master_vouchers &&
        result
      ) {
        result.forEach((item) => {
          delete item.voucher_package_master_vouchers;
        });
      }

      return result;
    } catch (error) {
      this.errorReport(error, 'general.general.fail');
    }
  }

  orderVoucherPackageCancelled;

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

  ticketCanceled(voucher_package_order_id: string) {
    return this.voucherPackagesCustomersService.ticketCanceled(
      voucher_package_order_id,
    );
  }

  ticketCompleted(voucher_package_order_id: string) {
    return this.voucherPackagesCustomersService.ticketCompleted(
      voucher_package_order_id,
    );
  }

  async getVoucherPosDetail(id: string) {
    try {
      return this.voucherPosService.getVoucherPosDetail(id);
    } catch (error) {
      this.errorReport(error, 'general.general.fail');
    }
  }
}
