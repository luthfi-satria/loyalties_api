import { MasterVouchersDocument } from 'src/master_vouchers/entities/master_voucher.entity';
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
import { VoucherPackageDocument } from './voucher-package.entity';

@Entity({ name: 'loyalties_voucher_packages_master_vouchers' })
export class VoucherPackagesMasterVouchersDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => MasterVouchersDocument,
    (master_voucher) => master_voucher.voucher_package_master_vouchers,
  )
  @JoinColumn({ name: 'master_voucher_id' })
  master_voucher: MasterVouchersDocument;
  @Column()
  master_voucher_id: string;

  @ManyToOne(
    () => VoucherPackageDocument,
    (voucher_packages) => voucher_packages.voucher_package_master_vouchers,
  )
  @JoinColumn({ name: 'voucher_package_id' })
  voucher_package: VoucherPackageDocument;
  @Column()
  voucher_package_id: string;

  @Column()
  quantity: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;

  constructor(init?: Partial<VoucherPackageDocument>) {
    Object.assign(this, init);
  }
}
