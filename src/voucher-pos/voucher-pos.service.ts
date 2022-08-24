/* eslint-disable prettier/prettier */
import { BadRequestException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { VoucherCodeService } from 'src/voucher_code/voucher_code.service';
import { ILike, LessThan, MoreThan } from 'typeorm';
import { CreateVoucherPosDto, UpdateVoucherPosDto } from './dto/voucher-pos.dto';
import { StatusVoucherPosGroup } from './entities/voucher-pos.entity';
import { VoucherPosRepository } from './repository/voucher-pos.repository';

@Injectable()
export class VoucherPosService {

    constructor(
        private readonly responseService: ResponseService,
        private readonly messageService: MessageService,
        private readonly voucherPosRepo: VoucherPosRepository,
        private readonly voucherCodeService: VoucherCodeService,
    ){};
    
    private readonly logger = new Logger(VoucherPosService.name);

    async getListVoucherPos(data) {
        try{
            const page = data.page || 1;
            const limit = data.limit || 10;
            const offset = (page - 1) * limit;

            let qry = {};

            if (data.brand_id) qry = { ...qry, brand_id: data.brand_id };
            if (data.status) qry = { ...qry, status: data.status };
            if (data.search) qry = { ...qry, code: ILike(`%${data.search}%`) };
            if (data.date_start)
                qry = { ...qry, date_start: MoreThan(data.date_start) };
            if (data.date_end)
                qry = { ...qry, date_end: LessThan(data.date_end) };

            const query = this.voucherPosRepo
            .createQueryBuilder('vp')
            .where(qry)
            .orderBy('vp.created_at','DESC')
            .take(limit)
            .skip(offset);

            const items = await query.getMany();
            const count = await query.getCount();
      
            const listItems = {
              current_page: parseInt(page),
              total_item: count,
              limit: parseInt(limit),
              items: items,
            };
      
            return listItems;
        }
        catch(error){
            this.logger.log(error);
            throw new BadRequestException(
              this.responseService.error(
                HttpStatus.BAD_REQUEST,
                {
                  value: '',
                  property: '',
                  constraint: [
                    this.messageService.get('general.list.fail'),
                    error.message,
                  ],
                },
                'Bad Request',
              ),
            );            
        }     
        return {test:true}
    }

    async createVoucherPos(data: CreateVoucherPosDto){
      const gmt_offset = '7';
      const timeStart = new Date(`${data.date_start} +${gmt_offset}`);
      const timeEnd = new Date(`${data.date_end} +${gmt_offset}`);
      
      // compare date_start & date_end
      this.voucherCodeService.checkVoucherCodeInPast(timeEnd)
      
      const now = new Date();

      // voucher status
      const status = !(data.status) ? (timeStart <= now ? StatusVoucherPosGroup.ACTIVE : StatusVoucherPosGroup.SCHEDULED) : data.status;

      data.date_start = timeStart;
      data.date_end = timeEnd;
      data.status = status;

      const createdVoucher = await this.voucherPosRepo
      .createQueryBuilder()
      .insert()
      .into('loyalties_voucher_pos')
      .values(data)
      .execute();

      return createdVoucher;
    }

    async updateVoucherPos(data: UpdateVoucherPosDto){
      try{
        const findVoucher = await this.voucherPosRepo.findOneOrFail({
          where: { id: data.id },
        });

        if(findVoucher){
          const gmt_offset = '7';
          const timeStart = new Date(`${data.date_start} +${gmt_offset}`);
          const timeEnd = new Date(`${data.date_end} +${gmt_offset}`);
          
          // compare date_start & date_end
          this.voucherCodeService.checkVoucherCodeInPast(timeEnd)
          
          const now = new Date();
    
          // voucher status
          const status = !(data.status) ? (timeStart <= now ? StatusVoucherPosGroup.ACTIVE : StatusVoucherPosGroup.SCHEDULED) : data.status;
    
          data.date_start = timeStart;
          data.date_end = timeEnd;
          data.status = status;
    
          const updateVoucher = await this.voucherPosRepo
          .createQueryBuilder()
          .update('loyalties_voucher_pos')
          .set(data)
          .where('id = :id',{ id: findVoucher.id })
          .execute();
    
          return updateVoucher;
        }

        return this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: 'status',
              property: 'status',
              constraint: [
                this.messageService.get('general.update.fail'),
                'id is not found',
              ],
            },
            'Bad Request',
        );        
      }
      catch(error){
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: 'status',
              property: 'status',
              constraint: [
                this.messageService.get('general.update.fail'),
                error.message,
              ],
            },
            'Bad Request',
          ),        
        );
      }
    }
}
