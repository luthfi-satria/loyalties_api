import { IsUUID, IsNotEmpty, IsOptional } from 'class-validator';

export class GetActiveTargetVouchersDto {
  @IsUUID()
  @IsNotEmpty()
  customer_id: string;

  @IsOptional()
  target: string;
}

export class UpdateVoucherStatusExpireDto {
  voucher_id: string;
}
