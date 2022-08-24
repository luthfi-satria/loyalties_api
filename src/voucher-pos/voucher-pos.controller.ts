/* eslint-disable prettier/prettier */
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { VoucherPosService } from './voucher-pos.service';
import {
    CreateVoucherPosDto,
    ListVoucherPosDto,
    UpdateVoucherPosDto,
} from './dto/voucher-pos.dto';

@Controller('api/v1/loyalties/voucher-pos')
export class VoucherPosController {
    constructor (
        private readonly voucherPosService: VoucherPosService,
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
    async getListVoucherPos(@Query() data: ListVoucherPosDto): Promise<RSuccessMessage>{
        try {
            const result = await this.voucherPosService.getListVoucherPos(data);
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
        try {
            const result = await this.voucherPosService.getVoucherPosDetail(id);
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
     * @param body 
     * @returns 
     */
    @Post('')
    @UserType('admin')
    @AuthJwtGuard()
    @ResponseStatusCode()
    async createVoucherPos(@Body() body: CreateVoucherPosDto): Promise<RSuccessMessage>{
        try{
            const result = await this.voucherPosService.createVoucherPos(body);
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
    async updateVoucherPos( @Body() body: UpdateVoucherPosDto): Promise<RSuccessMessage>{
        try{
            const result = await this.voucherPosService.updateVoucherPos(body);
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

    /**
     * 
     * @param body 
     * @returns 
     */
    @Delete(':id/delete')
    @UserType('admin')
    @AuthJwtGuard()
    @ResponseStatusCode()    
    async deleteVoucherPos(@Param('id') id: string ){ 
        try {
            const result = await this.voucherPosService.deleteVoucherPos(id);
            return this.responseService.success(
              true,
              this.messageService.get('general.delete.success'),
              result,
            );
          } catch (error) {
            console.error(error);
            throw error;
          }        
    }

    /**
     * 
     * @param body 
     * @returns 
     */
     @Put(':id/restore')
     @UserType('admin')
     @AuthJwtGuard()
     @ResponseStatusCode()    
     async restoreVoucherPos(@Param('id') id: string ){
         try {
             const result = await this.voucherPosService.restoreVoucherPos(id);
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
}