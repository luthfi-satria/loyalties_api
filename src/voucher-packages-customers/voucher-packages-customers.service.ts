import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { User } from 'src/auth/guard/interface/user.interface';
import { PaymentService } from 'src/common/payment/payment.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
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
      await this.voucherPackageService.getAndValidateVoucherPackageById(
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
        (voucherPackage.price *
          voucherPackage.quota *
          paymentMethod.admin_fee_percent) /
          100,
      );
    }

    const paramCreate: Partial<VoucherPackageOrderDocument> = {
      customer_id: user.id,
      voucher_package: undefined,
      voucher_package_id: voucherPackage.id,
      total_payment: voucherPackage.price * voucherPackage.quota + admin_fee,
      payment_method_id: paymentMethod.id,
      admin_fee: admin_fee,
      // payment_expired_at: undefined,
      // paid_at: undefined,
      status: StatusVoucherPackageOrder.WAITING,
    };
    try {
      const voucherPackageOrder = await this.voucherPackageOrderRepository.save(
        paramCreate,
      );

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

  mainQuery(): SelectQueryBuilder<VoucherPackageOrderDocument> {
    const query = this.voucherPackageOrderRepository
      .createQueryBuilder('voucher_package_order')
      .leftJoinAndSelect(
        'voucher_package_order.voucher_package',
        'voucher_package',
      )
      .leftJoinAndSelect(
        'voucher_package.voucher_package_master_vouchers',
        'voucher_package_master_vouchers',
      )
      .leftJoinAndSelect(
        'voucher_package_master_vouchers.master_voucher',
        'master_voucher',
      );
    return query;
  }

  async getList(params: ListVoucherPackageOrderDto): Promise<{
    current_page: number;
    total_item: number;
    limit: number;
    items: VoucherPackageOrderDocument[];
  }> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 10;
      const offset = (page - 1) * limit;

      let where = {};

      if (params.target) where = { ...where, target: params.target };
      if (params.status) {
        where = { ...where, status: params.status };
      } else {
        where = { ...where, status: StatusVoucherPackageOrder.WAITING };
      }
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

      const query = this.mainQuery().where(where).take(limit).skip(offset);

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

  async getDetail(id) {
    try {
      const query = this.mainQuery().where({ id });
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
