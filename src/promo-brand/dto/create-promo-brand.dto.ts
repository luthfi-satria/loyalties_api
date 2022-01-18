import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import {
  EnumPromoBrandType,
  EnumPromoBrandOrderType,
  EnumPromoBrandTarget,
  EnumPromoBrandDiscountType,
} from 'src/database/entities/promo-brand.entity';

export class BaseCreatePromoBrandDto {
  merchant_id: string;

  @IsNotEmpty()
  @IsEnum(EnumPromoBrandType)
  type: string;

  @IsNotEmpty()
  @IsEnum(EnumPromoBrandOrderType)
  order_type: string;

  @IsNotEmpty()
  @IsEnum(EnumPromoBrandTarget)
  target: string;

  @IsNotEmpty()
  @IsDateString()
  date_start: Date;

  @IsNotEmpty()
  @IsDateString()
  date_end: Date;

  @IsOptional()
  @IsNumber()
  minimum_transaction: number;

  @IsOptional()
  @IsNumber()
  quota: number;

  @IsNotEmpty()
  @IsEnum(EnumPromoBrandDiscountType)
  discount_type: string;

  @IsNotEmpty()
  @IsNumber()
  discount_value: number;

  @IsOptional()
  @IsNumber()
  discount_maximum: number;

  @IsNotEmpty()
  @IsBoolean()
  is_combinable: boolean;

  status: string;
}

export class DbCreatePromoBrandDto extends BaseCreatePromoBrandDto {
  id?: string;

  cancellation_reason?: string | null;
}
