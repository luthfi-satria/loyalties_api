import { VoucherCodeDocument } from './../../voucher_code/entities/voucher_code.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VoucherPackageDocument } from 'src/voucher-packages/entities/voucher-package.entity';
import { MasterVouchersDocument } from 'src/master_vouchers/entities/master_voucher.entity';

export enum TargetVoucherEnum {
  ALL = 'ALL',
  NEW = 'NEW',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum TypeVoucherEnum {
  SHOPPING_COST = 'SHOPPING_COST',
  DELIVERY_COST = 'DELIVERY_COST',
}

export enum DiscountTypeVoucherEnum {
  PERCENTAGE = 'PERCENTAGE',
  PRICE = 'PRICE',
}

export enum OrderTypeVoucherEnum {
  DELIVERY_ONLY = 'DELIVERY_ONLY',
  PICKUP_ONLY = 'PICKUP_ONLY',
  DELIVERY_AND_PICKUP = 'DELIVERY_AND_PICKUP',
}

export enum StatusVoucherEnum {
  CREATED = 'CREATED',
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
}

@Entity({ name: 'loyalties_voucher' })
export class VoucherDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  voucher_code_id: string;

  @Column('uuid', { nullable: true })
  voucher_package_id: string;

  @Column('uuid', { nullable: true })
  master_voucher_id: string;

  @Column('uuid', { nullable: true })
  customer_id: string;

  @Column({ nullable: true })
  code: string;

  @Column({
    type: 'enum',
    enum: TypeVoucherEnum,
    nullable: true,
  })
  type: TypeVoucherEnum;

  @Column({ nullable: true })
  order_type: string;

  @Column({
    type: 'enum',
    enum: TargetVoucherEnum,
    nullable: true,
  })
  target: TargetVoucherEnum;

  @Column({ type: 'timestamptz', nullable: true })
  date_start: Date;

  @Column({ type: 'timestamptz', nullable: true })
  date_end: Date;

  @Column({ nullable: true })
  minimum_transaction: number;

  @Column({
    type: 'enum',
    enum: DiscountTypeVoucherEnum,
    nullable: true,
  })
  discount_type: DiscountTypeVoucherEnum;

  @Column({ nullable: true })
  discount_value: number;

  @Column({ nullable: true })
  discount_maximum: number;

  @Column({ nullable: true })
  is_combinable: boolean;

  @Column({
    type: 'enum',
    enum: StatusVoucherEnum,
    default: StatusVoucherEnum.CREATED,
  })
  status: StatusVoucherEnum;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;

  @ManyToOne(() => VoucherCodeDocument, (voucher_code) => voucher_code.vouchers)
  @JoinColumn({ name: 'voucher_code_id', referencedColumnName: 'id' })
  vouchers: VoucherCodeDocument;

  @ManyToOne(
    () => VoucherPackageDocument,
    (voucher_packages) => voucher_packages.vouchers,
  )
  @JoinColumn({ name: 'voucher_package_id', referencedColumnName: 'id' })
  voucher_package: VoucherPackageDocument;

  @ManyToOne(
    () => MasterVouchersDocument,
    (master_voucher) => master_voucher.vouchers,
  )
  @JoinColumn({ name: 'master_voucher_id', referencedColumnName: 'id' })
  master_voucher: MasterVouchersDocument;

  constructor(init?: Partial<VoucherDocument>) {
    Object.assign(this, init);
  }
}
