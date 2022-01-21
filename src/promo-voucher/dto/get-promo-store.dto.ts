import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { User } from 'src/auth/guard/interface/user.interface';

export class GetPromoStoreDto {
  @IsNotEmpty()
  @IsUUID()
  merchant_id: string;

  @IsNotEmpty()
  @IsUUID()
  store_id: string;

  @IsOptional()
  customer?: User;
}
