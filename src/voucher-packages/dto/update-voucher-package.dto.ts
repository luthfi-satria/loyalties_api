import { IsNotEmpty, IsString } from 'class-validator';

export class CancelVoucherPackageDto {
  @IsNotEmpty()
  @IsString()
  cancellation_reason: string;

  id: string;
}

export class StopVoucherPackageDto {
  @IsNotEmpty()
  @IsString()
  cancellation_reason: string;

  id: string;
}

export class UpdateVoucherPackageStatusActiveDto {
  voucher_package_id: string;
}

export class UpdateVoucherPackageStatusFinishDto {
  @IsNotEmpty()
  @IsString()
  voucher_package_id: string;

  cancellation_reason?: string;
}
