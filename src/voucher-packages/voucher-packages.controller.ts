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
  Res,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { VoucherPackagesService } from './voucher-packages.service';
import { CreateVoucherPackageDto } from './dto/create-voucher-package.dto';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
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
import { Response } from 'express';
import etag from 'etag';
@Controller('api/v1/loyalties/admins/voucher-packages')
export class VoucherPackagesController {
  constructor(
    private readonly voucherPackagesService: VoucherPackagesService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
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
        fileSize: 50000000,//5MB
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
      this.voucherPackagesService.validateStartEndDate(
        createVoucherPackageDto.date_start,
        createVoucherPackageDto.date_end,
      );

      if (createVoucherPackageDto.photo_url) {
        // createVoucherPackageDto.photo = createVoucherPackageDto.photo_url;
        const voucherPackage = await this.voucherPackagesService.findOne(
          createVoucherPackageDto.photo_url,
        );
        if (!voucherPackage) delete createVoucherPackageDto.photo;
        createVoucherPackageDto.photo = voucherPackage.photo;
      } else {
        this.imageValidationService.setFilter('photo', 'required');
        await this.imageValidationService.validate(req);
        const path_photo = '/upload_loyalties/' + file.filename;
        createVoucherPackageDto.photo = await this.storage.store(path_photo);
      }

      const result = await this.voucherPackagesService.create(
        createVoucherPackageDto,
      );

      if (result.photo) {
        const fileName =
          result.photo.split('/')[result.photo.split('/').length - 1];
        result.photo = `${process.env.BASEURL_API}/api/v1/loyalties/admins/voucher-packages/${result.id}/image/${fileName}`;
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

  @Get()
  async getList(
    @Query() query: ListVoucherPackageDto,
  ): Promise<RSuccessMessage> {
    try {
      const gmt_offset = '7';
      if (query.periode_start) {
        query.periode_start = new Date(`${query.periode_start} +${gmt_offset}`);
      }
      if (query.periode_end) {
        query.periode_end = new Date(`${query.periode_end} +${gmt_offset}`);
      }
      const result = await this.voucherPackagesService.getList(query);
      for (const voucherPackage of result.items) {
        if (voucherPackage.photo) {
          const fileName =
            voucherPackage.photo.split('/')[
              voucherPackage.photo.split('/').length - 1
            ];
          voucherPackage.photo = `${process.env.BASEURL_API}/api/v1/loyalties/admins/voucher-packages/${voucherPackage.id}/image/${fileName}`;
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

  @Get(':voucher_package_id')
  async getDetail(
    @Param('voucher_package_id') voucherPackageId: string,
  ): Promise<RSuccessMessage> {
    try {
      const result = await this.voucherPackagesService.getDetail(
        voucherPackageId,
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

  @Get(':id/image/:image')
  async streamFile(
    @Param('id') id: string,
    @Param('image') fileName: string,
    @Res() res: Response,
    @Req() req: any,
  ) {
    const data = { id, fileName };
    let images = null;

    try {
      images = await this.voucherPackagesService.getBufferS3(data);
    } catch (error) {
      console.error(error);
      throw error;
    }

    const tag = etag(images.buffer);
    if (req.headers['if-none-match'] && req.headers['if-none-match'] === tag) {
      throw new HttpException('Not Modified', HttpStatus.NOT_MODIFIED);
    }

    res.set({
      'Content-Type': images.type + '/' + images.ext,
      'Content-Length': images.buffer.length,
      ETag: tag,
    });

    images.stream.pipe(res);
  }
}
