import {
  ArrayNotEmpty,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class AssignVoucherPosStoreDto {
  @IsNotEmpty()
  @IsUUID()
  voucher_pos_id: string;

  @IsNotEmpty()
  @ArrayNotEmpty()
  @IsString({ each: true })
  store_id: string[];
}

export class GetListVoucherPosStoreDto {
  @IsString()
  @IsOptional()
  search: string;

  page: number;

  limit: number;

  @IsOptional()
  @IsString()
  voucher_pos_id: string;

  @IsOptional()
  @IsString({ each: true })
  store_id: string[];

  @IsOptional()
  @IsString()
  merchant_id: string;

  @IsOptional()
  @IsString()
  target: string;
}
