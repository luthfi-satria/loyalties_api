import { IsIn, IsNumberString, IsOptional, IsString } from 'class-validator';
import {
  StatusVoucherPackage,
  TargetVoucherPackage,
} from 'src/voucher-packages/entities/voucher-package.entity';

export class ListVoucherPackageOrderDto {
  @IsOptional()
  search: string;

  page: number;

  limit: number;

  @IsOptional()
  @IsIn(Object.values(TargetVoucherPackage))
  target: TargetVoucherPackage;

  @IsOptional()
  @IsString()
  periode_start: Date;

  @IsOptional()
  @IsString()
  periode_end: Date;

  @IsOptional()
  @IsIn(Object.values(StatusVoucherPackage))
  status: StatusVoucherPackage;

  @IsOptional()
  @IsNumberString()
  price_min: string;

  @IsOptional()
  @IsNumberString()
  price_max: string;

  @IsOptional()
  is_available_for_ticket: string;

  @IsOptional()
  customer_id: string;
}
