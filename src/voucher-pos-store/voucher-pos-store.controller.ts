/* eslint-disable prettier/prettier */

import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { AuthJwtGuard } from "src/auth/auth.decorators";
import { UserType } from "src/auth/guard/user-type.decorator";
import { MessageService } from "src/message/message.service";
import { ResponseStatusCode } from "src/response/response.decorator";
import { RSuccessMessage } from "src/response/response.interface";
import { ResponseService } from "src/response/response.service";
import { AssignVoucherPosStoreDto } from "./dto/voucher-pos-store.dto";
import { VoucherPosStoreService } from "./voucher-pos-store.service";

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
    async getListStoreByVoucherPosAndBrand(@Query() data: AssignVoucherPosStoreDto): Promise<RSuccessMessage>{
        return 
    }

    /**
     * 
     * @param id 
     * @returns 
     */

    @Post('')
    @UserType('admin')
    @AuthJwtGuard()
    @ResponseStatusCode()
    async assignStoreByVoucherPos(@Body() data:AssignVoucherPosStoreDto): Promise<RSuccessMessage>{
        try{
            const bulkInsert = await this.voucherPosStoreService
            .assignVoucherToStore(data);
            return this.responseService.success(
                true,
                this.messageService.get('general.create.success'),
                bulkInsert
            );
        }
        catch(error){
            console.error(error);
            throw error;
        }
        return
    }

    @Delete('')
    @UserType('admin')
    @AuthJwtGuard()
    @ResponseStatusCode()
    async unassignStoreByVoucherPos(@Body() data:AssignVoucherPosStoreDto) : Promise<RSuccessMessage>{
        return
    }
}