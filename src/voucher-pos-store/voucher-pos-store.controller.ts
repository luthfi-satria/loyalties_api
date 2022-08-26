/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { VoucherPosStoreService } from './voucher-pos-store.service';
import {
    CreateVoucherPosStoreDto,
    ListVoucherPosStoreDto,
    UpdateVoucherPosStoreDto,
} from './dto/voucher-pos-store.dto';

@Controller('api/v1/loyalties/voucher-pos-store')
export class VoucherPosStoreController {
    constructor (
        private readonly voucherPosStoreService: VoucherPosStoreService,
        private readonly messageService: MessageService,
        private readonly responseService: ResponseService
    ){}

    /**
     * 
     * @param data 
     * @returns 
     */

    @Get('')
    @UserType('admin')
    @AuthJwtGuard()
    @ResponseStatusCode()
    async getListVoucherPosStore(@Query() data: ListVoucherPosStoreDto): Promise<RSuccessMessage>{
        try {
            const result = await this.voucherPosStoreService.getListVoucherPosStore(data);
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

    @Get(':id')
    @UserType('admin')
    @AuthJwtGuard()
    @ResponseStatusCode()
    async getDetailVoucherPos(@Param('id') id: string): Promise<RSuccessMessage>{
        return
    }


    /**
     * 
     * @param body 
     * @returns 
     */
    @Post('')
    @UserType('admin')
    @AuthJwtGuard()
    @ResponseStatusCode()
    async createVoucherPosStore(@Body() body: CreateVoucherPosStoreDto): Promise<RSuccessMessage>{
        try{
            const result = await this.voucherPosStoreService.createVoucherPosStore(body);
            return this.responseService.success(
                true,
                this.messageService.get('general.create.success'),
                result.raw,
            );
        }
        catch(error){
            console.error(error);
            throw error;
        }
    }

    /**
     * 
     * @param body 
     * @returns 
     */
    @Put('')
    @UserType('admin')
    @AuthJwtGuard()
    @ResponseStatusCode()
    async updateVoucherPosStore( @Body() body: UpdateVoucherPosStoreDto): Promise<RSuccessMessage>{
        try{
            const result = await this.voucherPosStoreService.updateVoucherPosStore(body);
            return this.responseService.success(
                true,
                this.messageService.get('general.update.success'),
                result,
            );
        }
        catch(error){
            console.error(error);
            throw error;
        }
    }
}