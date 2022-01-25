import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import _ from 'lodash';
import { User } from 'src/auth/guard/interface/user.interface';
import { OrderService } from 'src/common/order/order.service';
import { CreatePayment } from 'src/common/payment/interfaces/payment.interface';
import { PaymentService } from 'src/common/payment/payment.service';
import {
  CallBackOrderExpiredDto,
  CallBackOrderSuccessDto,
} from 'src/internal/dto/order-voucher-package.dto';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import {
  StatusVoucherPackage,
  TargetVoucherPackage,
  VoucherPackageDocument,
} from 'src/voucher-packages/entities/voucher-package.entity';
import { VoucherPackagesService } from 'src/voucher-packages/voucher-packages.service';
import {
  Brackets,
  In,
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
    private readonly orderService: OrderService,
  ) {}
  private readonly logger = new Logger(VoucherPackagesCustomersService.name);

  //CRUD
  async createOrder(
    user: User,
    params: CreateVoucherPackagesCustomerDto,
  ): Promise<VoucherPackageOrderDocument> {
    const voucherPackage =
      await this.getAndValidateVoucherPackageAvailableQuota(
        params.voucher_package_id,
      );

    const { data: customerTarget } =
      await this.orderService.getCostumerTargetLoyalties({
        customer_id: user.id,
        created_at: user.created_at,
      });
    if (
      voucherPackage.target != TargetVoucherPackage.ALL &&
      voucherPackage.target != customerTarget.target
    ) {
      this.errorGenerator(
        customerTarget.target,
        'target',
        'general.general.voucherTargetNotMatch',
      );
    }

    const payments = await this.paymentService.getPaymentsBulk({
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
        .createVoucherPayment(item)
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

  async cancelOrder(
    voucherPackageOrderId: string,
    user: User,
  ): Promise<VoucherPackageDocument> {
    const voucherPackage = await this.getAndValidateVoucherPackageOrderById(
      voucherPackageOrderId,
      user,
    );
    if (
      voucherPackage.voucher_package_orders.length &&
      voucherPackage.voucher_package_orders[0].status !=
        StatusVoucherPackageOrder.WAITING
    ) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: voucherPackage.voucher_package_orders[0].status,
            property: 'status',
            constraint: [
              this.messageService.get('general.voucher.notAvailable'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    voucherPackage.voucher_package_orders[0].status =
      StatusVoucherPackageOrder.CANCELLED;
    try {
      await this.voucherPackageOrderRepository.save(
        voucherPackage.voucher_package_orders[0],
      );

      return voucherPackage;
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
    const query = this.voucherPackageService.mainQuery();
    query.leftJoinAndSelect(
      'voucher_package.voucher_package_orders',
      'voucher_package_orders',
      'voucher_package_orders.customer_id = :customer_id AND voucher_package_orders.status = :order_status',
      {
        customer_id: user.id,
        order_status: StatusVoucherPackageOrder.WAITING,
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

      if (params.status) {
        where = { ...where, status: params.status };
      }
      const query = this.mainQuery(user).where(where);
      if (!params.status) {
        query.andWhere(
          new Brackets((qb) => {
            qb.where('voucher_package.status = :status', {
              status: StatusVoucherPackage.ACTIVE,
            });
            qb.orWhere(
              new Brackets((qb2) => {
                qb2
                  .where('voucher_package.status = :status_finished', {
                    status_finished: StatusVoucherPackage.FINISHED,
                  })
                  .andWhere(
                    'voucher_package_orders.status = :order_status_waiting',
                    {
                      order_status_waiting: StatusVoucherPackageOrder.WAITING,
                    },
                  );
              }),
            );
          }),
        );
        where = { ...where, status: StatusVoucherPackage.ACTIVE };
        // const query = this.mainQuery(user).where(where);
      }

      query.take(limit).skip(offset);

      let items = await query.getMany();
      const count = await query.getCount();

      items = await this.assignObjectPaymentMethod(items);

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
      const voucherPackage = await query.getOne();
      const voucherPackages = await this.assignObjectPaymentMethod([
        voucherPackage,
      ]);
      return voucherPackages[0];
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

  async orderVoucherPackageSuccess(
    data: CallBackOrderSuccessDto,
  ): Promise<any> {
    try {
      const orderId = data.order_id || null;

      //=> cari order
      const findOrder = await this.voucherPackageOrderRepository.findOneOrFail(
        orderId,
      );

      //=> proteksi status order
      if (findOrder.status != StatusVoucherPackageOrder.WAITING) {
        this.errorGenerator(
          findOrder.status,
          'status',
          'general.order.statusNotAllowed',
        );
      }

      //=> update status ke paid. paid_at dng new date
      findOrder.status = StatusVoucherPackageOrder.PAID;
      findOrder.paid_at = new Date();
      const updatedOrder = await this.voucherPackageOrderRepository.save(
        findOrder,
      );

      //=> generate vouchers
      await this.voucherPackageService.orderVoucherPackage(
        findOrder.voucher_package_id,
        findOrder.customer_id,
      );

      return updatedOrder;
    } catch (error) {
      this.errorReport(error, 'general.update.fail');
    }
  }

  async orderVoucherPackageExpired(
    data: CallBackOrderExpiredDto,
  ): Promise<any> {
    try {
      //=> Get informasi order
      const orderId = data.order_id || null;

      //=> cari order
      const findOrder = await this.voucherPackageOrderRepository.findOneOrFail(
        orderId,
      );

      //=> proteksi status order
      if (findOrder.status != StatusVoucherPackageOrder.WAITING) {
        this.errorGenerator(
          findOrder.status,
          'status',
          'general.order.statusNotAllowed',
        );
      }

      //=> update status ke expired
      findOrder.status = StatusVoucherPackageOrder.EXPIRED;
      return this.voucherPackageOrderRepository.save(findOrder);
    } catch (error) {
      this.errorReport(error, 'general.update.fail');
    }
  }

  async assignObjectPaymentMethod(
    voucherPackages: VoucherPackageDocument[],
  ): Promise<VoucherPackageDocument[]> {
    const paymentMethodIds = [];
    for (let i = 0; i < voucherPackages.length; i++) {
      const voucherPackage = voucherPackages[i];
      for (let j = 0; j < voucherPackage.voucher_package_orders.length; j++) {
        const voucherPackageOrder = voucherPackage.voucher_package_orders[j];
        paymentMethodIds.push(voucherPackageOrder.payment_method_id);
      }
    }
    if (!paymentMethodIds.length) {
      return voucherPackages;
    }
    const paymentMethods = await this.paymentService
      .getPaymentsBulk({
        ids: paymentMethodIds,
        isIncludeDeleted: false,
      })
      .catch((error) => {
        this.logger.error(error);
      });
    if (!paymentMethods) {
      return voucherPackages;
    }

    for (let i = 0; i < voucherPackages.length; i++) {
      const voucherPackage = voucherPackages[i];
      for (let j = 0; j < voucherPackage.voucher_package_orders.length; j++) {
        const voucherPackageOrder = voucherPackage.voucher_package_orders[j];
        voucherPackageOrder.payment_method = _.find(paymentMethods, {
          id: voucherPackageOrder.payment_method_id,
        });
      }
    }

    return voucherPackages;
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

  async getAndValidateVoucherPackageOrderById(
    voucherPackageId: string,
    user: User,
  ): Promise<VoucherPackageDocument> {
    const voucherPackage = await this.getDetail(voucherPackageId, user).catch(
      (error) => {
        throw error;
      },
    );
    if (!voucherPackage || !voucherPackage.voucher_package_orders.length) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: voucherPackageId,
            property: 'id',
            constraint: [
              this.messageService.get('general.general.dataNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    return voucherPackage;
  }

  async getAndValidateVoucherPackageAvailableQuota(
    voucherPackageId: string,
  ): Promise<VoucherPackageDocument> {
    const voucherPackage =
      await this.voucherPackageService.getAndValidateAvailableVoucherPackageById(
        voucherPackageId,
      );

    if (!voucherPackage.quota) {
      return voucherPackage;
    }

    const countSold = await this.voucherPackageOrderRepository.count({
      voucher_package_id: voucherPackageId,
      status: In([
        StatusVoucherPackageOrder.WAITING,
        StatusVoucherPackageOrder.PAID,
      ]),
    });

    if (voucherPackage.quota <= countSold) {
      this.errorGenerator('0', 'quota', 'general.voucher.quotaReached');
    }

    return voucherPackage;
  }
}
