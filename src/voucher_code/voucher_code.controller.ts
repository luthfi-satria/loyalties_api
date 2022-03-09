import { VoucherCodeService } from './voucher_code.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import {
  CancelVoucherCodeDto,
  CreateVoucherCodeDto,
  ListVoucherCodeDto,
  StopVoucherCodeDto,
} from './dto/voucher_code.dto';

@Controller('/api/v1/loyalties/voucher-codes')
export class VoucherCodeController {
  constructor(
    private readonly voucherCodeService: VoucherCodeService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  @Get(':id/stream-file')
  async streamFile(@Param('id') id: string, @Res() res: Response) {
    const data: any = { id };

    let buffer = null;
    let stream = null;
    try {
      buffer = await this.voucherCodeService.getBufferS3(data);
      stream = await this.voucherCodeService.getReadableStream(buffer);
    } catch (error) {
      console.log(error);
    }

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Length': buffer.length,
    });

    stream.pipe(res);
  }

  @Get('')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getListVoucherCode(
    @Query() data: ListVoucherCodeDto,
  ): Promise<RSuccessMessage> {
    try {
      const result = await this.voucherCodeService.getListVoucherCode(data);
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

  @Get(':id')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getVoucherCodeDetail(@Param() id: string): Promise<RSuccessMessage> {
    try {
      const result = await this.voucherCodeService.getVoucherCodeDetail(id);
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

  @Post(':id/excel')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async exportExcel(@Param() id: string): Promise<RSuccessMessage> {
    try {
      const result = await this.voucherCodeService.exportExcel(id);
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

  @Post()
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async createVoucherCode(
    @Body() data: CreateVoucherCodeDto,
  ): Promise<RSuccessMessage> {
    try {
      const result = await this.voucherCodeService.createVoucherCode(data);
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

  @Put(':voucher_code_id/cancelled')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async cancelVoucherCode(
    @Param('voucher_code_id') voucher_code_id: string,
    @Body() data: CancelVoucherCodeDto,
  ) {
    data.id = voucher_code_id;
    const result = await this.voucherCodeService.cancelVoucherCode(data);
    return this.responseService.success(
      true,
      this.messageService.get('general.general.success'),
      result,
    );
  }

  @Put(':voucher_code_id/stopped')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async stopVoucherCode(
    @Param('voucher_code_id') voucher_code_id: string,
    @Body() data: StopVoucherCodeDto,
  ) {
    data.id = voucher_code_id;
    const result = await this.voucherCodeService.stopVoucherCode(data);
    return this.responseService.success(
      true,
      this.messageService.get('general.general.success'),
      result,
    );
  }
}
