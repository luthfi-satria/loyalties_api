import { Type } from 'class-transformer';
import {
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  IsUUID,
  ValidateIf,
  IsBoolean,
} from 'class-validator';
import {
  EnumPromoBrandTarget,
  EnumPromoBrandType,
  EnumPromoBrandStatus,
  EnumPromoBrandOrderType,
} from 'src/database/entities/promo-brand.entity';
import { EnumGetPromoProviderTarget } from 'src/internal/dto/get-promo-vouchers.dto';
// import { EnumGetPromoBrandTarget } from 'src/internal/dto/get-promo-vouchers.dto';

export class ListPromoBrandDto {
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
  @IsEnum(EnumPromoBrandTarget)
  target: string;

  @IsOptional()
  @IsString()
  @IsEnum(EnumPromoBrandType)
  type: string;

  @IsOptional()
  @IsString()
  periode_start: string;

  @IsOptional()
  @IsString()
  periode_end: string;

  @IsOptional()
  @IsString()
  @IsEnum(EnumPromoBrandStatus)
  status: string;

  @IsOptional()
  @IsString()
  @IsEnum(EnumPromoBrandOrderType)
  order_type: string;

  merchant_id: string;
}

export class DetailPromoBrandDto {
  merchant_id: string;
  promo_brand_id: string;
}

export class ExtendedListPromoBrandDto extends ListPromoBrandDto {
  promo_brand_id: string;

  cart_total: number;

  target_list: string[];

  order_type_list: string[];

  is_quota_available: boolean;
}

export class GetPromoBrandsDto {
  @IsOptional()
  @IsString()
  @IsEnum(EnumGetPromoProviderTarget)
  target: string;

  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => o.merchant_id !== '')
  merchant_id: string;

  @IsOptional()
  @IsBoolean()
  is_quota_available?: boolean;
}
