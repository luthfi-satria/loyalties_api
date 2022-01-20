import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';
import { CreatePayment, GetPaymentsBulk } from './interfaces/payment.interface';

@Injectable()
export class PaymentService {
  constructor(private readonly httpService: HttpService) {}

  logger = new Logger();

  async createPayment(data: CreatePayment): Promise<any> {
    try {
      const headerRequest = {
        'Content-Type': 'application/json',
      };
      return await firstValueFrom(
        this.httpService
          .post(
            `${process.env.BASEURL_PAYMENTS_SERVICE}/api/v1/payments/internal/payments`,
            data,
            { headers: headerRequest },
          )
          .pipe(map((resp) => resp.data)),
      );
    } catch (e) {
      this.logger.error(
        `${process.env.BASEURL_PAYMENTS_SERVICE}/api/v1/payments/internal/payments ${e.message}`,
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

  async getPaymentsBulk(data: GetPaymentsBulk): Promise<any> {
    try {
      const headerRequest = {
        'Content-Type': 'application/json',
      };
      return await firstValueFrom(
        this.httpService
          .get(
            `${process.env.BASEURL_PAYMENTS_SERVICE}/api/v1/payments/internal/payments/bulk`,
            { headers: headerRequest, params: data },
          )
          .pipe(map((resp) => resp.data)),
      );
    } catch (e) {
      this.logger.error(
        `${process.env.BASEURL_PAYMENTS_SERVICE}/api/v1/payments/internal/payments/bulk ${e.message}`,
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