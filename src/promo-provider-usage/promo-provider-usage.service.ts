import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { EnumPromoProviderUsageStatus } from 'src/database/entities/promo-provider-usage.entity';
import { PromoProviderUsageRepository } from 'src/database/repository/promo-provider-usage.repository';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';

@Injectable()
export class PromoProviderUsageService {
  constructor(
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly promoProviderUsageRepository: PromoProviderUsageRepository,
  ) {}

  private readonly logger = new Logger(PromoProviderUsageService.name);

  async usePromoProvider(data: any) {
    try {
      const promoIds = data.promo_provider_ids || null;
      const orderId = data.id || null;
      const customerId = data.customer_id || null;

      const promises = promoIds?.map((promoId: string) => {
        const promoUsage = this.promoProviderUsageRepository.create({
          promo_provider_id: promoId,
          order_id: orderId,
          customer_id: customerId,
          status: EnumPromoProviderUsageStatus.USED,
        });
        return this.promoProviderUsageRepository.save(promoUsage);
      });

      if (promises) {
        await Promise.all(promises).catch(() => {
          this.errorGenerator('', '', 'general.update.fail');
        });
      }
    } catch (error) {
      this.errorReport(error, 'general.update.fail');
    }
  }

  async cancelPromoProvider(data: any) {
    try {
      const promoIds = data.promo_provider_ids || null;
      const orderId = data.id || null;
      const customerId = data.customer_id || null;

      const promises = promoIds?.map(async (promoId: string) => {
        const promoUsage = this.promoProviderUsageRepository.create({
          status: EnumPromoProviderUsageStatus.CANCELLED,
        });
        return this.promoProviderUsageRepository.update(
          {
            promo_provider_id: promoId,
            order_id: orderId,
            customer_id: customerId,
            status: EnumPromoProviderUsageStatus.USED,
          },
          promoUsage,
        );
      });

      if (promises) {
        await Promise.all(promises).catch(() => {
          this.errorGenerator('', '', 'general.update.fail');
        });
      }
    } catch (error) {
      this.errorReport(error, 'general.update.fail');
    }
  }

  //   async bulkCheckPromoProviderQuota(promoIds: string[]): Promise<any[]> {
  //     try {

  //     } catch (error) {
  //       this.errorReport(error, 'general.list.fail');
  //     }
  //   }

  //=> Utility services. Only Services called internally defined here.

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
