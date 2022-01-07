import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  DiscountGroup,
  DurationGroup,
  TypeGroup,
} from '../entities/voucher.entity';

export class CreateVoucherDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEnum(TypeGroup, { message: 'Type invalid' })
  type: TypeGroup;

  @IsEnum(DurationGroup, { message: 'Duration invalid' })
  duration: DurationGroup;

  @IsNumber()
  @IsNotEmpty()
  minimum_transaction: number;

  @IsNotEmpty()
  @IsString()
  order_type: string;

  @IsEnum(DiscountGroup, { message: 'Discount invalid' })
  discount_type: DiscountGroup;

  @IsNumber()
  @IsNotEmpty()
  discount_value: number;

  @IsNumber()
  @IsNotEmpty()
  discount_maximum: number;

  @IsBoolean()
  @IsNotEmpty()
  is_combinable: boolean;
}

export class ListVoucherDto {
  @IsString()
  @IsOptional()
  search: string;

  page: number;

  limit: number;

  @IsEnum(TypeGroup, { message: 'Type invalid' })
  @IsOptional()
  type: TypeGroup;

  @IsEnum(DurationGroup, { message: 'Duration invalid' })
  @IsOptional()
  duration: DurationGroup;

  @IsString()
  @IsOptional()
  order_type: string;
}
