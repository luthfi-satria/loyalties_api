import { IsNotEmpty, IsOptional } from 'class-validator';

export class GetVoucherPackageBulkDto {
  @IsNotEmpty()
  voucher_package_ids: string[];

  @IsOptional()
  is_remove_voucher_package_master_vouchers?: boolean;
}

export class GetVoucherPackageOrderBulkDto {
  ids: string[];
}