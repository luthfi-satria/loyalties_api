import { VoucherService } from './voucher.service';
import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { AuthJwtGuard, GetUser } from 'src/auth/auth.decorators';
import { User } from 'src/auth/guard/interface/user.interface';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';

@Controller('/api/v1/loyalties/vouchers')
export class VoucherController {
  constructor(
    private readonly voucherService: VoucherService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  @Post('redeem')
  @UserType('customer')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async redeemVoucher(
    @Body() data: any,
    @Req() req: any,
    @GetUser() user: User,
  ): Promise<RSuccessMessage> {
    try {
      const result = await this.voucherService.redeemVoucher(
        { ...data, customer: user },
        req.user.id,
      );
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
  @UserType('customer')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getMyVouchers(
    @Query() data: any,
    @Req() req: any,
    @GetUser() user: User,
  ): Promise<RSuccessMessage> {
    try {
      const result = await this.voucherService.getMyVouchers(
        { ...data, customer: user },
        req.user.id,
      );
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
