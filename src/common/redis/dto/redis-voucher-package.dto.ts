export class CreateAutoStartVoucherPackageDto {
  voucher_package_id: string;
  delay: number;
}

export class DeleteAutoStartVoucherPackageDto {
  voucher_package_id: string;
}

export class CreateAutoFinishVoucherPackageDto {
  voucher_package_id: string;
  delay: number;
}

export class DeleteAutoFinishVoucherPackageDto {
  voucher_package_id: string;
}
