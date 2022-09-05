import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import {
  AssignVoucherPosStoreDto,
  GetListVoucherPosStoreDto,
} from './dto/voucher-pos-store.dto';
import { VoucherPosStoreService } from './voucher-pos-store.service';

@Controller('api/v1/loyalties/voucher-pos-store')
export class VoucherPosStoreController {
  constructor(
    private readonly voucherPosStoreService: VoucherPosStoreService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  /**
   *
   * @param data
   * @returns
   */

  @Post(':voucher_pos_id')
  @UserTypeAndLevel(
    'admin.*',
    'merchant.group',
    'merchant.merchant',
    'merchant.store',
  )
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getListStoreByVoucherPosId(
    @Param('voucher_pos_id') id: string,
    @Body() data: GetListVoucherPosStoreDto,
  ): Promise<RSuccessMessage> {
    try {
      const result =
        await this.voucherPosStoreService.getListStoreByVoucherPosId(id, data);
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

  /**
   *
   * @param id
   * @returns
   */

  @Post('')
  @UserTypeAndLevel(
    'admin.*',
    'merchant.group',
    'merchant.merchant',
    'merchant.store',
  )
  @AuthJwtGuard()
  @ResponseStatusCode()
  async assignStoreByVoucherPos(
    @Body() data: AssignVoucherPosStoreDto,
  ): Promise<RSuccessMessage> {
    try {
      const bulkInsert = await this.voucherPosStoreService.assignVoucherToStore(
        data,
      );
      return this.responseService.success(
        true,
        this.messageService.get('general.create.success'),
        bulkInsert,
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   *
   * @param data
   * @returns
   */

  @Delete('')
  @UserTypeAndLevel(
    'admin.*',
    'merchant.group',
    'merchant.merchant',
    'merchant.store',
  )
  @AuthJwtGuard()
  @ResponseStatusCode()
  async unassignStoreByVoucherPos(
    @Body() data: AssignVoucherPosStoreDto,
  ): Promise<RSuccessMessage> {
    try {
      const hardDelete =
        await this.voucherPosStoreService.unassignVoucherFromStore(data);
      return this.responseService.success(
        true,
        this.messageService.get('general.delete.success'),
        hardDelete,
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
