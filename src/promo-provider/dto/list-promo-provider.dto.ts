import { Type } from 'class-transformer';
import { IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';
import {
  EnumPromoProviderTarget,
  EnumPromoProviderType,
  EnumPromoProviderStatus,
  EnumPromoProviderOrderType,
} from 'src/database/entities/promo-provider.entity';

export class ListPromoProviderDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page: number;

  @IsOptional()
  @IsString()
  @IsEnum(EnumPromoProviderTarget)
  target: string;

  @IsOptional()
  @IsString()
  @IsEnum(EnumPromoProviderType)
  type: string;

  @IsOptional()
  @IsString()
  periode_start: string;

  @IsOptional()
  @IsString()
  periode_end: string;

  @IsOptional()
  @IsString()
  @IsEnum(EnumPromoProviderStatus)
  status: string;

  @IsOptional()
  @IsString()
  @IsEnum(EnumPromoProviderOrderType)
  order_type: string;
}

export class DetailPromoProviderDto {
  promo_provider_id: string;
}

export class ExtendedListPromoProviderDto extends ListPromoProviderDto {
  promo_provider_id: string;

  minimum_transaction: number;

  target_list: string[];

  order_type_list: string[];
}
