import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
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

@Entity({ name: 'loyalties_voucher' })
export class VouchersDocument {
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

  @Column()
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

  constructor(init?: Partial<VouchersDocument>) {
    Object.assign(this, init);
  }
}
