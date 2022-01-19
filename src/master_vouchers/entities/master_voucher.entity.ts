import { MasterVoucherVoucherCodeDocument } from 'src/master_voucher_voucher_code/entities/master_voucher_voucher_code.entity';
import { VoucherPackagesMasterVouchersDocument } from 'src/voucher-packages/entities/voucher-package-master-voucher.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TypeGroup {
  SHOPPING_COST = 'SHOPPING_COST',
  DELIVERY_COST = 'DELIVERY_COST',
}

export enum DiscountGroup {
  PERCENTAGE = 'PERCENTAGE',
  PRICE = 'PRICE',
}

export enum DurationGroup {
  ONE_DAY = '1DAY',
  THREE_DAYS = '3DAYS',
  SEVEN_DAYS = '7DAYS',
  TEN_DAYS = '10DAYS',
  FOURTEEN_DAYS = '14DAYS',
  THIRTY_DAYS = '30DAYS',
}

@Entity({ name: 'loyalties_master_voucher' })
export class MasterVouchersDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: TypeGroup,
    nullable: true,
  })
  type: TypeGroup;

  @Column({
    type: 'enum',
    enum: DurationGroup,
    nullable: true,
  })
  duration: DurationGroup;

  @Column({ nullable: true })
  minimum_transaction: number;

  @Column()
  order_type: string;

  @Column({
    type: 'enum',
    enum: DiscountGroup,
    nullable: true,
  })
  discount_type: DiscountGroup;

  @Column()
  discount_value: number;

  @Column({ nullable: true })
  discount_maximum: number;

  @Column()
  is_combinable: boolean;

  @OneToMany(
    () => MasterVoucherVoucherCodeDocument,
    (master_voucher_voucher_code) => master_voucher_voucher_code.master_voucher,
  )
  master_voucher_voucher_code: MasterVoucherVoucherCodeDocument[];

  @OneToMany(
    () => VoucherPackagesMasterVouchersDocument,
    (voucher_package_master_vouchers) =>
      voucher_package_master_vouchers.master_voucher,
  )
  voucher_package_master_vouchers: VoucherPackagesMasterVouchersDocument[];

  @CreateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;

  constructor(init?: Partial<MasterVouchersDocument>) {
    Object.assign(this, init);
  }
}
