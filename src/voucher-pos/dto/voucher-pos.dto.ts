import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import {
  StatusVoucherPosGroup,
  DiscountTypeVoucherEnum,
  PeriodicalType,
} from '../entities/voucher-pos.entity';

export class CreateVoucherPosDto {
  @IsNotEmpty()
  brand_id: string;

  @IsNotEmpty()
  brand_name: string;

  @IsNotEmpty()
  @Length(3, 50)
  name: string;

  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  sales_mode: string[];

  @IsOptional()
  @IsEnum(StatusVoucherPosGroup, { message: 'invalid status option' })
  status: StatusVoucherPosGroup;

  @IsNotEmpty()
  @IsDateString()
  date_start: Date;

  @IsNotEmpty()
  @IsDateString()
  date_end: Date;

  @IsNotEmpty()
  @IsEnum(PeriodicalType, { message: 'invalid period type' })
  period_type: string;

  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  daily_period: string[];

  @IsNotEmpty()
  @IsBoolean()
  is_validated: boolean;

  @IsOptional()
  @IsNumber()
  min_transaction: number;

  @IsNotEmpty()
  @IsEnum(DiscountTypeVoucherEnum, { message: 'tipe diskon tidak sesuai' })
  discount_type: DiscountTypeVoucherEnum;

  @IsNotEmpty()
  @IsNumber()
  nominal: number;

  @IsOptional()
  @IsNumber()
  discount_max: number;

  @IsOptional()
  @IsBoolean()
  is_combined: boolean;
}

export class ListVoucherPosDto {
  @IsString()
  @IsOptional()
  search: string;

  page: number;

  limit: number;

  @IsOptional()
  @IsString()
  brand_id: string;

  @IsOptional()
  @IsString()
  store_id: string;

  @IsOptional()
  @IsString()
  date_start: string;

  @IsOptional()
  @IsString()
  date_end: string;

  @IsEnum(StatusVoucherPosGroup, { message: 'Status invalid' })
  @IsOptional()
  status: StatusVoucherPosGroup;
}

export class UpdateVoucherPosDto {}
