import { IsNotEmpty, IsUUID } from 'class-validator';

export class CallBackOrderSuccessDto {
  @IsNotEmpty()
  @IsUUID()
  order_id: string;
}

export class CallBackOrderCancelledDto {
  @IsNotEmpty()
  @IsUUID()
  order_id: string;
}
