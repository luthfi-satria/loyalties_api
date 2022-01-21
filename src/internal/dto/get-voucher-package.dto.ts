import { IsNotEmpty } from 'class-validator';

export class GetVoucherPackageBulkDto {
  @IsNotEmpty()
  voucher_package_ids: string[];
}
