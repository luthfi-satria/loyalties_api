import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';
import {
  EnumPromoProviderType,
  EnumPromoProviderOrderType,
  EnumPromoProviderTarget,
  EnumPromoProviderDiscountType,
} from 'src/database/entities/promo-provider.entity';

export class BaseCreatePromoProviderDto {
  @IsNotEmpty()
  @IsEnum(EnumPromoProviderType)
  type: string;

  @IsNotEmpty()
  @IsEnum(EnumPromoProviderOrderType)
  order_type: string;

  @IsNotEmpty()
  @IsEnum(EnumPromoProviderTarget)
  target: string;

  @IsNotEmpty()
  @IsDateString()
  date_start: Date;

  @IsNotEmpty()
  @IsDateString()
  date_end: Date;

  @IsNotEmpty()
  @IsNumber()
  minimum_transaction: number;

  @IsNotEmpty()
  @IsNumber()
  quota: number;

  @IsNotEmpty()
  @IsEnum(EnumPromoProviderDiscountType)
  discount_type: string;

  @IsNotEmpty()
  @IsNumber()
  discount_value: number;

  @IsNotEmpty()
  @IsBoolean()
  is_combinable: boolean;

  status: string;
}

export class DbCreatePromoProviderDto extends BaseCreatePromoProviderDto {
  id?: string;

  cancellation_reason?: string | null;
}
