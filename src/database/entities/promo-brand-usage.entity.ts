import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum EnumPromoBrandUsageStatus {
  USED = 'USED',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'loyalties_promo_brand_usages' })
export class PromoBrandUsageDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  promo_brand_id: string;

  @Column({ type: 'uuid' })
  customer_id: string;

  @Column({ type: 'uuid' })
  order_id: string;

  @Column({ enum: EnumPromoBrandUsageStatus })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;
}
