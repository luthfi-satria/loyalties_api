import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { CreateVoucherDto, ListVoucherDto } from './dto/voucher.dto';
import { VoucherService } from './voucher.service';

@Controller('/api/v1/loyalties/vouchers')
export class VoucherController {
  constructor(
    private readonly voucherService: VoucherService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  @Post()
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async setHowtos(@Body() data: CreateVoucherDto): Promise<RSuccessMessage> {
    try {
      const result = await this.voucherService.createVoucher(data);
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
  async getVoucherDetail(@Param() id: string): Promise<RSuccessMessage> {
    try {
      const result = await this.voucherService.getVoucherDetail(id);
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
  async getListVoucher(
    @Query() data: ListVoucherDto,
  ): Promise<RSuccessMessage> {
    try {
      const result = await this.voucherService.getListVoucher(data);
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
