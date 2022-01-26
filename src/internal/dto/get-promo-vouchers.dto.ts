import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export enum EnumGetPromoProviderTarget {
  NEW = 'NEW',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum EnumGetPromoProviderOrderType {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
}

export class GetPromoVouchersDto {
  @IsOptional()
  @IsString()
  @IsEnum(EnumGetPromoProviderTarget)
  target: string;

  @IsOptional()
  @IsString()
  @IsEnum(EnumGetPromoProviderOrderType)
  order_type: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  cart_total: number;

  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => o.customer_id !== '')
  customer_id: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  delivery_fee: number;

  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => o.merchant_id !== '')
  merchant_id: string;

  @IsOptional()
  is_quota_available: string;
}
