import {
  StatusVoucherCodeGroup,
  TargetGroup,
} from './../entities/voucher_code.entity';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { MasterVouchersDocument } from 'src/master_vouchers/entities/master_voucher.entity';

export class CreateVoucherCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNotEmpty()
  @IsDateString()
  date_start: Date;

  @IsNotEmpty()
  @IsDateString()
  date_end: Date;

  @IsBoolean()
  @IsNotEmpty()
  is_prepopulated: boolean;

  master_vouchers: any;

  @IsEnum(TargetGroup, { message: 'Target invalid' })
  target: TargetGroup;

  @IsEnum(StatusVoucherCodeGroup, { message: 'Status invalid' })
  @ValidateIf((o) => o.status === '')
  status: StatusVoucherCodeGroup;

  @IsNumber()
  @ValidateIf((o) => o.is_prepopulated === false && o.quota === '')
  quota: number;
}

export class CreateVoucherCodeToDbDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNotEmpty()
  @IsDateString()
  date_start: Date;

  @IsNotEmpty()
  @IsDateString()
  date_end: Date;

  @IsBoolean()
  @IsNotEmpty()
  is_prepopulated: boolean;

  // master_vouchers: MasterVouchersDocument[];

  @IsEnum(TargetGroup, { message: 'Target invalid' })
  target: TargetGroup;

  @IsEnum(StatusVoucherCodeGroup, { message: 'Status invalid' })
  @ValidateIf((o) => o.status === '')
  status: StatusVoucherCodeGroup;

  @IsNumber()
  @ValidateIf((o) => o.is_prepopulated === false && o.quota === '')
  quota: number;
}

export class MasterVoucherVoucherCodeDto {
  master_voucher_id: string;
  quantity: number;
}

export class ListVoucherCodeDto {
  @IsString()
  @IsOptional()
  search: string;

  page: number;

  limit: number;

  @IsEnum(TargetGroup, { message: 'Target invalid' })
  @IsOptional()
  target: TargetGroup;

  @IsOptional()
  @IsString()
  periode_start: string;

  @IsOptional()
  @IsString()
  periode_end: string;

  @IsEnum(StatusVoucherCodeGroup, { message: 'Status invalid' })
  @IsOptional()
  status: StatusVoucherCodeGroup;
}

export class CancelVoucherCodeDto {
  @IsString()
  @IsNotEmpty()
  cancellation_reason: string;

  id: string;
}

export class StopVoucherCodeDto {
  @IsString()
  @IsNotEmpty()
  cancellation_reason: string;

  id: string;

  isBypassValidation?: boolean;
}

export class UpdateVoucherCodeStatusActiveDto {
  voucher_code_id: string;
}

export class UpdateVoucherCodeStatusFinishDto {
  voucher_code_id: string;
}
