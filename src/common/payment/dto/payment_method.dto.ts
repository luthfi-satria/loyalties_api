export class PaymentMethodDTO {
  id: string;
  epayment_id: number;
  name: string;
  logo: string;
  epayment_status: number;
  type: number;
  expiration_time: number;
  admin_fee_fixed: number;
  admin_fee_percent: number;
  status: string;
  payment_type: string;
  min_price: number;
  max_price: number;
  mdr_enabled: boolean;
  sequence: number;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date;
}
