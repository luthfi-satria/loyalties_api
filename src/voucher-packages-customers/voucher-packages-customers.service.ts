import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { User } from 'src/auth/guard/interface/user.interface';
import { CreatePayment } from 'src/common/payment/interfaces/payment.interface';
import { PaymentService } from 'src/common/payment/payment.service';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { VoucherPackageDocument } from 'src/voucher-packages/entities/voucher-package.entity';
import { VoucherPackagesService } from 'src/voucher-packages/voucher-packages.service';
import {
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  SelectQueryBuilder,
} from 'typeorm';
import { CreateVoucherPackagesCustomerDto } from './dto/create-voucher-packages-customer.dto';
import { ListVoucherPackageOrderDto } from './dto/list-voucher-package.dto';
import {
  StatusVoucherPackageOrder,
  VoucherPackageOrderDocument,
} from './entities/voucher-packages-order.entity';
import { VoucherPackageOrderRepository } from './repository/voucher_package_order.repository';

@Injectable()
export class VoucherPackagesCustomersService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly voucherPackageOrderRepository: VoucherPackageOrderRepository,
    private readonly voucherPackageService: VoucherPackagesService,
    private readonly paymentService: PaymentService,
  ) {}
  private readonly logger = new Logger(VoucherPackagesCustomersService.name);

  //CRUD
  async createOrder(
    user: User,
    params: CreateVoucherPackagesCustomerDto,
  ): Promise<VoucherPackageOrderDocument> {
    const voucherPackage =
      await this.voucherPackageService.getAndValidateAvailableVoucherPackageById(
        params.voucher_package_id,
      );

    const { payments } = await this.paymentService.getPaymentsBulk({
      ids: [params.payment_method_id],
      isIncludeDeleted: false,
    });

    const paymentMethod = payments[0];
    let admin_fee = 0;
    if (!paymentMethod) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: params.payment_method_id,
            property: 'payment_method_id',
            constraint: [
              this.messageService.get('general.create.fail'),
              this.messageService.get('general.general.dataNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    if (paymentMethod.admin_fee_fixed) {
      admin_fee = paymentMethod.admin_fee_fixed;
    } else if (paymentMethod.admin_fee_percent) {
      admin_fee = Math.ceil(
        (voucherPackage.price * paymentMethod.admin_fee_percent) / 100,
      );
    }

    console.log(
      '===========================Start Debug =================================\n',
      new Date(Date.now()).toLocaleString(),
      '\n',
      paymentMethod,
      '\n============================End Debug ==================================',
    );
    const paramCreate: Partial<VoucherPackageOrderDocument> = {
      customer_id: user.id,
      voucher_package: undefined,
      voucher_package_id: voucherPackage.id,
      total_payment: voucherPackage.price + admin_fee,
      payment_method_id: paymentMethod.id,
      admin_fee: admin_fee,
      payment_expired_at: undefined,
      // paid_at: undefined,
      status: StatusVoucherPackageOrder.WAITING,
    };
    try {
      const voucherPackageOrder = await this.voucherPackageOrderRepository.save(
        paramCreate,
      );

      //=>Tembak create payment
      const item: CreatePayment = {
        order_id: voucherPackageOrder.id,
        payment_method_id: voucherPackageOrder.payment_method_id,
        customer_id: voucherPackageOrder.customer_id,
        price: voucherPackage.price,
        // card: {
        //   number: '1234123412341234',
        //   expired_month: 3,
        //   expired_year: 2030,
        // },
      };
      const payment = await this.paymentService
        .createPayment(item)
        .catch((error) => {
          const errors: RMessage = {
            value: '',
            property: 'payment',
            constraint: [
              this.messageService.get('general.create.fail'),
              this.messageService.get('general.order.paymentFail'),
              {
                code: 'PAYMENT_GATEWAY_FAILED',
                message: error.response?.[0].constraint[0] || '',
              },
            ],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              errors,
              'Bad Request',
            ),
          );
        });

      //=>Update order with payment expirate at, ongkir, total,
      voucherPackageOrder.payment_expired_at = payment.data.expired_at;
      voucherPackageOrder.payment_info = payment.data;
      await this.voucherPackageOrderRepository.save(voucherPackageOrder);

      return voucherPackageOrder;
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('general.create.fail'),
              error.message,
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  mainQuery(user: User): SelectQueryBuilder<VoucherPackageDocument> {
    const query = this.voucherPackageService
      .mainQuery()
      .innerJoinAndSelect(
        'voucher_package.voucher_package_orders',
        'voucher_package_orders',
        'voucher_package_orders.customer_id = :customer_id',
        {
          customer_id: user.id,
        },
      );
    return query;
  }

  async getList(
    params: ListVoucherPackageOrderDto,
    user: User,
  ): Promise<{
    current_page: number;
    total_item: number;
    limit: number;
    items: VoucherPackageDocument[];
  }> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 10;
      const offset = (page - 1) * limit;

      let where = {};

      if (params.target) where = { ...where, target: params.target };
      if (params.search) where = { ...where, name: Like(`%${params.search}%`) };
      if (params.periode_start) {
        where = { ...where, created_at: MoreThanOrEqual(params.periode_start) };
      }
      if (params.periode_end) {
        where = { ...where, created_at: LessThanOrEqual(params.periode_end) };
      }
      if (params.price_min) {
        where = { ...where, price: MoreThanOrEqual(params.price_min) };
      }
      if (params.price_min) {
        where = { ...where, price: LessThanOrEqual(params.price_max) };
      }

      const query = this.mainQuery(user).where(where);
      if (params.status) {
        query.andWhere('voucher_package_orders.status = :status', {
          status: params.status,
        });
      } else {
        query.andWhere('voucher_package_orders.status = :status', {
          status: StatusVoucherPackageOrder.WAITING,
        });
      }

      query.take(limit).skip(offset);

      const items = await query.getMany();
      const count = await query.getCount();

      const listItems = {
        current_page: +page,
        total_item: count,
        limit: +limit,
        items: items,
      };

      return listItems;
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('general.list.fail'),
              error.message,
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  async getDetail(
    voucherPackageid: string,
    user: User,
  ): Promise<VoucherPackageDocument> {
    try {
      const query = this.mainQuery(user).where({ id: voucherPackageid });
      return query.getOne();
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('general.get.fail'),
              error.message,
            ],
          },
          'Bad Request',
        ),
      );
    }
  }
}
