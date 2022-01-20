import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateVoucherPackagesCustomerDto {
  @IsNotEmpty()
  @IsUUID()
  voucher_package_id: string;

  @IsNotEmpty()
  @IsUUID()
  payment_method_id: string;
}
