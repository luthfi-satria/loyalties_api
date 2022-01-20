import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { TargetVoucherPackage } from '../entities/voucher-package.entity';

export class CreateVoucherPackageDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsDateString()
  date_start: Date;

  @IsNotEmpty()
  @IsDateString()
  date_end: Date;

  @IsNotEmpty()
  @IsIn(Object.values(TargetVoucherPackage))
  target: TargetVoucherPackage;

  @IsOptional()
  @IsNumberString()
  quota: number;

  @IsNotEmpty()
  @IsNumberString()
  price: number;

  photo: string;

  @IsObject()
  master_vouchers: any;
}
