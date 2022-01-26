import { MasterVouchersDocument } from './../../master_vouchers/entities/master_voucher.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VoucherDocument } from 'src/voucher/entities/voucher.entity';
import { MasterVoucherVoucherCodeDocument } from 'src/master_voucher_voucher_code/entities/master_voucher_voucher_code.entity';

export enum TargetGroup {
  ALL = 'ALL',
  NEW = 'NEW',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum StatusVoucherCodeGroup {
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  STOPPED = 'STOPPED',
  FINISHED = 'FINISHED',
}

@Entity({ name: 'loyalties_voucher_code' })
export class VoucherCodeDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column({ type: 'timestamptz' })
  date_start: Date;

  @Column({ type: 'timestamptz' })
  date_end: Date;

  @Column()
  is_prepopulated: boolean;

  @Column({
    type: 'enum',
    enum: TargetGroup,
    nullable: true,
  })
  target: TargetGroup;

  @Column({ nullable: true })
  quota: number;

  @Column({ nullable: true })
  cancellation_reason: string;

  @Column({ enum: StatusVoucherCodeGroup })
  status: string;

  @ManyToMany(() => MasterVouchersDocument)
  // @JoinTable({ name: 'loyalties_master_voucher_voucher_code' })
  master_vouchers: MasterVouchersDocument[];

  @OneToMany(
    () => MasterVoucherVoucherCodeDocument,
    (master_voucher_voucher_code) => master_voucher_voucher_code.voucher_code,
    { eager: true },
  )
  master_voucher_voucher_code: MasterVoucherVoucherCodeDocument[];

  @OneToMany(() => VoucherDocument, (voucher) => voucher.vouchers, {
    eager: true,
  })
  vouchers: VoucherDocument[];

  @Column({ nullable: true })
  excel_file: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;

  constructor(init?: Partial<VoucherCodeDocument>) {
    Object.assign(this, init);
  }
}
