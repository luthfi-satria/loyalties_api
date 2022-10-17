import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TargetVoucherPosGroup {
  ALL = 'ALL',
  NEW = 'NEW',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum StatusVoucherPosGroup {
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  STOPPED = 'STOPPED',
  FINISHED = 'FINISHED',
}

export enum DiscountTypeVoucherEnum {
  PERCENTAGE = 'PERCENTAGE',
  PRICE = 'PRICE',
}

export enum PeriodicalType {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

@Entity({ name: 'loyalties_voucher_pos' })
export class VoucherPosDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    length: 50,
    nullable: false,
  })
  name: string;

  @Column({
    length: 40,
    nullable: true,
  })
  group_id: string;

  @Column({
    length: 40,
    nullable: false,
  })
  brand_id: string;

  @Column({
    nullable: false,
  })
  brand_name: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  sales_mode: string[];

  @Column({
    type: 'enum',
    enum: DiscountTypeVoucherEnum,
    nullable: false,
    default: DiscountTypeVoucherEnum.PRICE,
  })
  discount_type: DiscountTypeVoucherEnum;

  @Column({ nullable: true, default: 0 })
  nominal: number;

  @Column({
    nullable: false,
    default: 0,
  })
  min_transaction: number;

  @Column({
    nullable: true,
    default: 0,
  })
  discount_max: number;

  @Column({
    type: 'timestamptz',
  })
  date_start: Date;

  @Column({
    type: 'timestamptz',
  })
  date_end: Date;

  @Column({
    type: 'enum',
    enum: StatusVoucherPosGroup,
    nullable: false,
    default: StatusVoucherPosGroup.ACTIVE,
  })
  status: StatusVoucherPosGroup;

  @Column({
    nullable: true,
  })
  abort_reason: string;

  @Column({
    type: 'enum',
    enum: PeriodicalType,
    nullable: false,
    default: PeriodicalType.NONE,
  })
  period_type: PeriodicalType;

  @Column({
    type: 'jsonb',
  })
  daily_period: string[];

  @Column({
    nullable: false,
    default: false,
  })
  is_validated: boolean;

  @Column({
    nullable: false,
    default: false,
  })
  is_combined: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  created_at: Date | string;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'LOCALTIMESTAMP',
    onUpdate: 'LOCALTIMESTAMP',
  })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date | string;

  @OneToMany(
    () => VoucherPosStoreDocument,
    (assigned_store) => assigned_store.voucher_pos_id,
    { eager: true },
  )
  assigned_store: VoucherPosStoreDocument[];

  constructor(init?: Partial<VoucherPosDocument>) {
    Object.assign(this, init);
  }
}

@Entity({ name: 'loyalties_voucher_pos_store' })
export class VoucherPosStoreDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => VoucherPosDocument, (voucher_pos) => voucher_pos.id, {
    orphanedRowAction: 'delete',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'voucher_pos_id',
    referencedColumnName: 'id',
  })
  voucher_pos_id: VoucherPosDocument;

  @Column({
    length: 40,
    nullable: true,
  })
  store_id: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date | string;

  constructor(init?: Partial<VoucherPosStoreDocument>) {
    Object.assign(this, init);
  }
}
