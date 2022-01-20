import { PartialType } from '@nestjs/mapped-types';
import { CreateVoucherPackagesCustomerDto } from './create-voucher-packages-customer.dto';

export class UpdateVoucherPackagesCustomerDto extends PartialType(
  CreateVoucherPackagesCustomerDto,
) {}
