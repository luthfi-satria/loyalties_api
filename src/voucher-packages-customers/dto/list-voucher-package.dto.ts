import { IsIn, IsNumberString, IsOptional, IsString } from 'class-validator';
import { TargetVoucherPackage } from 'src/voucher-packages/entities/voucher-package.entity';
import { StatusVoucherPackageOrder } from '../entities/voucher-packages-order.entity';

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
  @IsIn(Object.values(StatusVoucherPackageOrder))
  status: StatusVoucherPackageOrder;

  @IsOptional()
  @IsNumberString()
  price_min: string;

  @IsOptional()
  @IsNumberString()
  price_max: string;
}
