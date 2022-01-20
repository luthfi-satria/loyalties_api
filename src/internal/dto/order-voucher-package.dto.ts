import { IsNotEmpty, IsUUID } from 'class-validator';

export class CallBackOrderSuccessDto {
  @IsNotEmpty()
  @IsUUID()
  order_id: string;
}

export class CallBackOrderExpiredDto {
  @IsNotEmpty()
  @IsUUID()
  order_id: string;
}
