import { IsNotEmpty, IsString } from 'class-validator';

export class AssignVoucherPosStoreDto {
  @IsNotEmpty()
  @IsString()
  voucher_pos_id: string;

  @IsNotEmpty()
  @IsString()
  store_id: string;
}
