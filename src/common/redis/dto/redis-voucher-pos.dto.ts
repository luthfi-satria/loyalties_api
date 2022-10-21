export class CreateAutoStartVoucherPosDto {
  voucher_pos_id: string;
  delay: number;
}

export class DeleteAutoStartVoucherPosDto {
  voucher_pos_id: string;
}

export class CreateAutoFinishVoucherPosDto {
  voucher_pos_id: string;
  delay: number;
}

export class DeleteAutoFinishVoucherPosDto {
  voucher_pos_id: string;
}
