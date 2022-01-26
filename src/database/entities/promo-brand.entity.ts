import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EnumPromoBrandType {
  SHOPPING_COST = 'SHOPPING_COST',
  DELIVERY_COST = 'DELIVERY_COST',
}

export enum EnumPromoBrandOrderType {
  DELIVERY_ONLY = 'DELIVERY_ONLY',
  PICKUP_ONLY = 'PICKUP_ONLY',
  DELIVERY_AND_PICKUP = 'DELIVERY_AND_PICKUP',
}

export enum EnumPromoBrandTarget {
  ALL = 'ALL',
  NEW = 'NEW',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum EnumPromoBrandDiscountType {
  PERCENTAGE = 'PERCENTAGE',
  PRICE = 'PRICE',
}

export enum EnumPromoBrandStatus {
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  STOPPED = 'STOPPED',
  FINISHED = 'FINISHED',
}

@Entity({ name: 'loyalties_promo_brands' })
export class PromoBrandDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  merchant_id: string;

  @Column({ enum: EnumPromoBrandType })
  type: string;

  @Column()
  order_type: string;

  @Column({ enum: EnumPromoBrandTarget })
  target: string;

  @Column({ type: 'timestamptz' })
  date_start: Date;

  @Column({ type: 'timestamptz' })
  date_end: Date;

  @Column({ nullable: true })
  minimum_transaction: number;

  @Column({ nullable: true })
  quota: number;

  @Column({ enum: EnumPromoBrandDiscountType })
  discount_type: string;

  @Column()
  discount_value: number;

  @Column({ nullable: true })
  discount_maximum: number;

  @Column({ nullable: true })
  cancellation_reason: string;

  @Column()
  is_combinable: boolean;

  @Column({ enum: EnumPromoBrandStatus })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;

  quota_left?: number;
}
