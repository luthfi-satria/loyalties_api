export class CreateAutoStartVoucherCodeDto {
  voucher_code_id: string;
  delay: number;
}

export class DeleteAutoStartVoucherCodeDto {
  voucher_code_id: string;
}

export class CreateAutoFinishVoucherCodeDto {
  voucher_code_id: string;
  delay: number;
}

export class DeleteAutoFinishVoucherCodeDto {
  voucher_code_id: string;
}
