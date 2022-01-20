import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum EnumPromoProviderUsageStatus {
  USED = 'USED',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'loyalties_promo_provider_usages' })
export class PromoProviderUsageDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  promo_provider_id: string;

  @Column({ type: 'uuid' })
  customer_id: string;

  @Column({ type: 'uuid' })
  order_id: string;

  @Column({ enum: EnumPromoProviderUsageStatus })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;
}
