import { ArrayNotEmpty, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AssignVoucherPosStoreDto {
  @IsNotEmpty()
  @IsUUID()
  voucher_pos_id: string;

  @IsNotEmpty()
  @ArrayNotEmpty()
  @IsString({ each: true })
  store_id: string[];
}
