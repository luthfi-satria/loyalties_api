import { IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class FetchMasterVoucherVoucherCodesDto {
  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => o.loyaltiesVoucherCodeId !== '')
  loyaltiesVoucherCodeId: string;

  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => o.loyaltiesMasterVoucherId !== '')
  loyaltiesMasterVoucherId: string;
}
