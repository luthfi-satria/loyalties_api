import { Controller, Get, Post, Body, Param, Query, Put } from '@nestjs/common';
import { VoucherPackagesCustomersService } from './voucher-packages-customers.service';
import { CreateVoucherPackagesCustomerDto } from './dto/create-voucher-packages-customer.dto';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { AuthJwtGuard, GetUser } from 'src/auth/auth.decorators';
import { RSuccessMessage } from 'src/response/response.interface';
import { User } from 'src/auth/guard/interface/user.interface';
import { ListVoucherPackageOrderDto } from './dto/list-voucher-package.dto';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { DateTimeUtils } from 'src/utils/date-time-utils';

@Controller('api/v1/loyalties/voucher-packages')
export class VoucherPackagesCustomersController {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly dateTimeUtils: DateTimeUtils,
    private readonly voucherPackagesCustomersService: VoucherPackagesCustomersService,
  ) {}

  @Post()
  @UserType('customer')
  @AuthJwtGuard()
  async createOrder(
    @GetUser() user: User,
    @Body() createVoucherPackageCustomerDto: CreateVoucherPackagesCustomerDto,
  ): Promise<RSuccessMessage> {
    try {
      const result = await this.voucherPackagesCustomersService.createOrder(
        user,
        createVoucherPackageCustomerDto,
      );
      if (result?.voucher_package?.photo) {
        const fileName =
          result.voucher_package.photo.split('/')[
            result.voucher_package.photo.split('/').length - 1
          ];
        result.voucher_package.photo = `${process.env.BASEURL_API}/api/v1/loyalties/admins/voucher-packages/${result.voucher_package.id}/image/${fileName}`;
      }
      return this.responseService.success(
        true,
        this.messageService.get('general.create.success'),
        result,
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Put(':voucher_package_id/cancelled')
  @UserType('customer')
  @AuthJwtGuard()
  async cancelOrder(
    @GetUser() user: User,
    @Param('voucher_package_id') voucherPackageId: string,
  ): Promise<RSuccessMessage> {
    try {
      const result = await this.voucherPackagesCustomersService.cancelOrder(
        voucherPackageId,
        user,
      );
      if (result.photo) {
        const fileName =
          result.photo.split('/')[result.photo.split('/').length - 1];
        result.photo = `${process.env.BASEURL_API}/api/v1/loyalties/admins/voucher-packages/${result.id}/image/${fileName}`;
      }
      return this.responseService.success(
        true,
        this.messageService.get('general.update.success'),
        result,
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Get()
  @UserType('customer')
  @AuthJwtGuard()
  async getList(
    @GetUser() user: User,
    @Query() query: ListVoucherPackageOrderDto,
  ): Promise<RSuccessMessage> {
    try {
      const gmt_offset = '7';
      if (query.periode_start) {
        query.periode_start = new Date(`${query.periode_start} +${gmt_offset}`);
      }
      if (query.periode_end) {
        query.periode_end = new Date(`${query.periode_end} +${gmt_offset}`);
      }
      const result = await this.voucherPackagesCustomersService.getList(
        query,
        user,
      );

      for (let i = 0; i < result.items.length; i++) {
        const res = result.items[i];
        if (res.photo) {
          const fileName =
            res.photo.split('/')[res.photo.split('/').length - 1];
          res.photo = `${process.env.BASEURL_API}/api/v1/loyalties/admins/voucher-packages/${res.id}/image/${fileName}`;
        }
      }

      return this.responseService.success(
        true,
        this.messageService.get('general.list.success'),
        result,
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Get(':voucher_package_order_id')
  @UserType('customer')
  @AuthJwtGuard()
  async getDetail(
    @GetUser() user: User,
    @Param('voucher_package_order_id') voucherPackageOrderId: string,
  ): Promise<RSuccessMessage> {
    try {
      const result = await this.voucherPackagesCustomersService.getDetail(
        voucherPackageOrderId,
        user,
      );

      if (result.photo) {
        const fileName =
          result.photo.split('/')[result.photo.split('/').length - 1];
        result.photo = `${process.env.BASEURL_API}/api/v1/loyalties/admins/voucher-packages/${result.id}/image/${fileName}`;
      }

      return this.responseService.success(
        true,
        this.messageService.get('general.get.success'),
        result,
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
