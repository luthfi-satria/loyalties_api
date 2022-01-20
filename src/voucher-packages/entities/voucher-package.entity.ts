import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VoucherPackagesMasterVouchersDocument } from './voucher-package-master-voucher.entity';
import { VoucherPackageOrderDocument } from '../../voucher-packages-customers/entities/voucher-packages-order.entity';

export enum TargetVoucherPackage {
  ALL = 'ALL',
  NEW = 'NEW',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum StatusVoucherPackage {
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  STOPPED = 'STOPPED',
  FINISHED = 'FINISHED',
}

@Entity({ name: 'loyalties_voucher_packages' })
export class VoucherPackageDocument {
  constructor(init?: Partial<VoucherPackageDocument>) {
    Object.assign(this, init);
  }

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'timestamptz' })
  date_start: Date;

  @Column({ type: 'timestamptz' })
  date_end: Date;

  @Column({
    type: 'enum',
    enum: TargetVoucherPackage,
  })
  target: TargetVoucherPackage;

  @Column({ nullable: true })
  quota: number;

  @Column()
  price: number;

  @Column({
    default: 'https://dummyimage.com/600x400/968a96/ffffff&text=Photo+Image',
  })
  photo: string;

  @Column({ nullable: true })
  cancellation_reason: string;

  @Column({
    type: 'enum',
    enum: StatusVoucherPackage,
  })
  status: StatusVoucherPackage;

  @OneToMany(
    () => VoucherPackagesMasterVouchersDocument,
    (voucher_package_master_vouchers) =>
      voucher_package_master_vouchers.voucher_package,
  )
  voucher_package_master_vouchers: VoucherPackagesMasterVouchersDocument[];

  @OneToMany(
    () => VoucherPackageOrderDocument,
    (voucher_package_orders) => voucher_package_orders.voucher_package,
  )
  voucher_package_orders: VoucherPackageOrderDocument[];

  @CreateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;
}
