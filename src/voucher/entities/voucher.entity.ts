import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

@Entity({ name: 'loyalties_voucher' })
export class VoucherDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  voucher_code_id: string;

  @Column('uuid', { nullable: true })
  customer_id: string;

  @Column()
  code: string;

  @Column({
    type: 'enum',
    enum: TypeVoucherEnum,
    nullable: true,
  })
  type: TypeVoucherEnum;

  @Column({
    type: 'enum',
    enum: OrderTypeVoucherEnum,
    nullable: true,
  })
  order_type: OrderTypeVoucherEnum;

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

  @Column()
  discount_value: number;

  @Column()
  discount_maximum: number;

  @Column()
  is_combinable: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;

  constructor(init?: Partial<VoucherDocument>) {
    Object.assign(this, init);
  }
}
