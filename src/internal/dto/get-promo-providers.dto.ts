import { Type } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';

export enum EnumGetPromoProviderTarget {
  NEW = 'NEW',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum EnumGetPromoProviderOrderType {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
}

export class GetPromoProvidersDto {
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
}
