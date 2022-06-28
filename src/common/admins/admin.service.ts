import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';

@Injectable()
export class AdminService {
  constructor(private readonly httpService: HttpService) {}

  logger = new Logger();

  async getTicketSetting(): Promise<any> {
    try {
      const headerRequest = {
        'Content-Type': 'application/json',
      };
      const targetStatus = await firstValueFrom(
        this.httpService
          .get(
            `${process.env.BASEURL_ADMINS_SERVICE}/api/v1/admins/settings/limit-create-order-ticket`,
            { headers: headerRequest },
          )
          .pipe(map((resp) => resp.data)),
      );
      return targetStatus;
    } catch (e) {
      this.logger.error(
        `${process.env.BASEURL_ORDERS_SERVICE}/api/v1/orders/internal/orders/customers/target ${e.message}`,
      );
      if (e.response) {
        throw new HttpException(
          e.response.data.message,
          e.response.data.statusCode,
        );
      } else {
        throw new InternalServerErrorException();
      }
    }
  }
}
