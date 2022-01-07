import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EnumPromoProviderType {
  SHOPPING_COST = 'SHOPPING_COST',
  DELIVERY_COST = 'DELIVERY_COST',
}

export enum EnumPromoProviderOrderType {
  DELIVERY_ONLY = 'DELIVERY_ONLY',
  PICKUP_ONLY = 'PICKUP_ONLY',
  DELIVERY_AND_PICKUP = 'DELIVERY_AND_PICKUP',
}

export enum EnumPromoProviderTarget {
  ALL = 'ALL',
  NEW = 'NEW',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum EnumPromoProviderDiscountType {
  PERCENTAGE = 'PERCENTAGE',
  PRICE = 'PRICE',
}

export enum EnumPromoProviderStatus {
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  STOPPED = 'STOPPED',
  FINISHED = 'FINISHED',
}

@Entity({ name: 'loyalties_promo_providers' })
export class PromoProviderDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ enum: EnumPromoProviderType })
  type: string;

  @Column()
  order_type: string;

  @Column({ enum: EnumPromoProviderTarget })
  target: string;

  @Column({ type: 'timestamptz' })
  date_start: Date;

  @Column({ type: 'timestamptz' })
  date_end: Date;

  @Column()
  minimum_transaction: number;

  @Column()
  quota: number;

  @Column({ enum: EnumPromoProviderDiscountType })
  discount_type: string;

  @Column()
  discount_value: number;

  @Column({ nullable: true })
  discount_maximum: number;

  @Column({ nullable: true })
  cancellation_reason: string;

  @Column()
  is_combinable: boolean;

  @Column({ enum: EnumPromoProviderStatus })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;
}
