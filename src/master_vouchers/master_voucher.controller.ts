import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import {
  CreateMasterVoucherDto,
  ListMasterVoucherDto,
} from './dto/master_voucher.dto';
import { MasterVoucherService } from './master_voucher.service';

@Controller('/api/v1/loyalties/master-vouchers')
export class MasterVoucherController {
  constructor(
    private readonly masterVoucherService: MasterVoucherService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  @Post()
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async createMasterVoucher(
    @Body() data: CreateMasterVoucherDto,
  ): Promise<RSuccessMessage> {
    try {
      const result = await this.masterVoucherService.createMasterVoucher(data);
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

  @Get(':id')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getMasterVoucherDetail(@Param() id: string): Promise<RSuccessMessage> {
    try {
      const result = await this.masterVoucherService.getMasterVoucherDetail(id);
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

  @Get('')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getListMasterVoucher(
    @Query() data: ListMasterVoucherDto,
  ): Promise<RSuccessMessage> {
    try {
      const result = await this.masterVoucherService.getListMasterVoucher(data);
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
}
