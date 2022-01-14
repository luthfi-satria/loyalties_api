import { IsUUID, IsNotEmpty } from 'class-validator';

export class GetActiveTargetVouchersDto {
  @IsUUID()
  @IsNotEmpty()
  customer_id: string;

  @IsNotEmpty()
  target: string;
}
