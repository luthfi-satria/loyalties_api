import { VoucherPackageDocument } from 'src/voucher-packages/entities/voucher-package.entity';
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

export enum StatusVoucherPackageOrder {
  WAITING = 'WAITING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  REFUND = 'REFUND',
}

@Entity({ name: 'loyalties_voucher_packages_orders' })
export class VoucherPackageOrderDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customer_id: string;

  @ManyToOne(
    () => VoucherPackageDocument,
    (voucher_packages) => voucher_packages.voucher_package_orders,
  )
  @JoinColumn({ name: 'voucher_package_id' })
  voucher_package: VoucherPackageDocument;
  @Column()
  voucher_package_id: string;

  @Column()
  total_payment: number;

  @Column({ nullable: true })
  payment_method_id: string;

  @Column({ nullable: true })
  admin_fee: number;

  @Column({ nullable: true, type: 'timestamptz' })
  payment_expired_at: Date;

  @Column({ type: 'json', nullable: true })
  payment_info: any;

  @Column({ nullable: true, type: 'timestamptz' })
  paid_at: Date;

  @Column({ type: 'enum', enum: StatusVoucherPackageOrder })
  status: StatusVoucherPackageOrder;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;

  constructor(init?: Partial<VoucherPackageOrderDocument>) {
    Object.assign(this, init);
  }
}
