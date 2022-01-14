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
} from '../entities/master_voucher.entity';

export class CreateMasterVoucherDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEnum(TypeGroup, { message: 'Type invalid' })
  type: TypeGroup;

  @IsEnum(DurationGroup, { message: 'Duration invalid' })
  duration: DurationGroup;

  @IsNumber()
  @IsOptional()
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
  @IsOptional()
  discount_maximum: number;

  @IsBoolean()
  @IsNotEmpty()
  is_combinable: boolean;
}

export class ListMasterVoucherDto {
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
