import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseInterceptors,
  Req,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { VoucherPackagesService } from './voucher-packages.service';
import { CreateVoucherPackageDto } from './dto/create-voucher-package.dto';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { DateTimeUtils } from 'src/utils/date-time-utils';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from 'src/utils/general-utils';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { ListVoucherPackageDto } from './dto/list-voucher-package.dto';
import { RSuccessMessage } from 'src/response/response.interface';
import {
  CancelVoucherPackageDto,
  StopVoucherPackageDto,
} from './dto/update-voucher-package.dto';

@Controller('api/v1/loyalties/admins/voucher-packages')
export class VoucherPackagesController {
  constructor(
    private readonly voucherPackagesService: VoucherPackagesService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly dateTimeUtils: DateTimeUtils,
    private readonly imageValidationService: ImageValidationService,
    private readonly storage: CommonStorageService,
  ) {}

  @Post()
  @UserType('admin')
  @AuthJwtGuard()
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './upload_loyalties',
        filename: editFileName,
      }),
      limits: {
        fileSize: 20000000,
      },
      fileFilter: imageFileFilter,
    }),
  )
  async create(
    @Req() req: any,
    @Body() createVoucherPackageDto: CreateVoucherPackageDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const gmt_offset = '7';
      createVoucherPackageDto.date_start = new Date(
        `${createVoucherPackageDto.date_start} +${gmt_offset}`,
      );
      createVoucherPackageDto.date_end = new Date(
        `${createVoucherPackageDto.date_end} +${gmt_offset}`,
      );
      this.dateTimeUtils.validateStartEndDateWithCurrentDate(
        createVoucherPackageDto.date_start,
        createVoucherPackageDto.date_end,
      );

      this.imageValidationService.setFilter('photo', 'required');
      await this.imageValidationService.validate(req);
      const path_photo = '/upload_loyalties/' + file.filename;
      createVoucherPackageDto.photo = await this.storage.store(path_photo);

      const result = await this.voucherPackagesService.create(
        createVoucherPackageDto,
      );
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

  @Get()
  async getList(
    @Query() query: ListVoucherPackageDto,
  ): Promise<RSuccessMessage> {
    try {
      const gmt_offset = '7';
      query.periode_start = new Date(`${query.periode_start} +${gmt_offset}`);
      query.periode_end = new Date(`${query.periode_end} +${gmt_offset}`);
      const result = await this.voucherPackagesService.getList(query);
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

  @Get(':voucher_package_id')
  async getDetail(
    @Param('voucher_package_id') voucherPackageId: string,
  ): Promise<RSuccessMessage> {
    try {
      const result = await this.voucherPackagesService.getDetail(
        voucherPackageId,
      );
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

  @Put(':voucher_package_id/cancelled')
  @UserType('admin')
  @AuthJwtGuard()
  async cancelled(
    @Param('voucher_package_id') voucherPackageId: string,
    @Body() cancelVoucherPackageDto: CancelVoucherPackageDto,
  ): Promise<RSuccessMessage> {
    try {
      cancelVoucherPackageDto.id = voucherPackageId;
      const result = await this.voucherPackagesService.cancel(
        cancelVoucherPackageDto,
      );
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

  @Put(':voucher_package_id/stopped')
  @UserType('admin')
  @AuthJwtGuard()
  async stopped(
    @Param('voucher_package_id') voucherPackageId: string,
    @Body() stopVoucherPackageDto: StopVoucherPackageDto,
  ): Promise<RSuccessMessage> {
    try {
      stopVoucherPackageDto.id = voucherPackageId;
      const result = await this.voucherPackagesService.stop(
        stopVoucherPackageDto,
      );
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
