export interface Card {
  number: string;
  expired_month: number;
  expired_year: number;
}

export interface CreatePayment {
  order_id: string;
  payment_method_id: string;
  customer_id: string;
  price: number;
  card?: Card;
}

export interface GetPaymentsBulk {
  ids: string[];
  isIncludeDeleted: boolean;
}
