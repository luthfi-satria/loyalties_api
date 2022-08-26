/* eslint-disable prettier/prettier */

import { Injectable, Logger } from "@nestjs/common";
import { MessageService } from "src/message/message.service";
import { ResponseService } from "src/response/response.service";
import { VoucherPosStoreRepository } from "./repository/voucher-pos-store.repository";

@Injectable()
export class VoucherPosStoreService {

    constructor(
        private readonly responseService: ResponseService,
        private readonly messageService: MessageService,
        private readonly voucherPosStoreRepo: VoucherPosStoreRepository,
    ){};
    
    private readonly logger = new Logger(VoucherPosStoreService.name);

      async getListStoreByVoucherAndBrand(data){
        return
      }

      async assignVoucherToStore(data){
        return
      }

      async unassignVoucherFromStore(data){
        return 
      }
}
