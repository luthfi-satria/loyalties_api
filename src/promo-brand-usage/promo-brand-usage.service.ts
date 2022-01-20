import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { EnumPromoBrandUsageStatus } from 'src/database/entities/promo-brand-usage.entity';
import { PromoBrandUsageRepository } from 'src/database/repository/promo-brand-usage.repository';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';

@Injectable()
export class PromoBrandUsageService {
  constructor(
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly promoBrandUsageRepository: PromoBrandUsageRepository,
  ) {}

  private readonly logger = new Logger(PromoBrandUsageService.name);

  async usePromoBrand(data: any) {
    try {
      const promoIds = data.promo_brand_ids || null;
      const orderId = data.id || null;
      const customerId = data.customer_id || null;

      const promises = promoIds?.map((promoId: string) => {
        const promoUsage = this.promoBrandUsageRepository.create({
          promo_brand_id: promoId,
          order_id: orderId,
          customer_id: customerId,
          status: EnumPromoBrandUsageStatus.USED,
        });
        return this.promoBrandUsageRepository.save(promoUsage);
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

  async cancelPromoBrand(data: any) {
    try {
      const promoIds = data.promo_brand_ids || null;
      const orderId = data.id || null;
      const customerId = data.customer_id || null;

      const promises = promoIds?.map(async (promoId: string) => {
        const promoUsage = this.promoBrandUsageRepository.create({
          status: EnumPromoBrandUsageStatus.CANCELLED,
        });
        return this.promoBrandUsageRepository.update(
          {
            promo_brand_id: promoId,
            order_id: orderId,
            customer_id: customerId,
            status: EnumPromoBrandUsageStatus.USED,
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
