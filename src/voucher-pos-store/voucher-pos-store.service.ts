/* eslint-disable prettier/prettier */

import { BadRequestException, HttpStatus, Injectable, Logger } from "@nestjs/common";
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
        try{
          const bulkInsert = [];
          if(data.store_id.length > 0){
            // assign list of store into data objects
            for(const storeId of data.store_id){
              bulkInsert.push({
                voucher_pos_id: data.voucher_pos_id,
                store_id : storeId
              });
            }
            
            // insert data objects into database
            const query = await this.voucherPosStoreRepo
            .createQueryBuilder()
            .insert()
            .into('loyalties_voucher_pos_store')
            .values(bulkInsert)
            .execute();

            return query;
          }
        }
        catch(error){
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              {
                value: 'status',
                property: 'status',
                constraint: [
                  this.messageService.get('general.insert.fail'),
                  error.message,
                ],
              },
              'Bad Request',
            ),        
          );
        }
      }

      async unassignVoucherFromStore(data){
        return 
      }
}
