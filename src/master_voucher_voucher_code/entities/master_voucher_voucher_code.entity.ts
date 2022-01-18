import { MasterVouchersDocument } from 'src/master_vouchers/entities/master_voucher.entity';
import { VoucherCodeDocument } from './../../voucher_code/entities/voucher_code.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity({ name: 'loyalties_master_voucher_voucher_code' })
export class MasterVoucherVoucherCodeDocument {
  @PrimaryColumn('uuid')
  loyaltiesVoucherCodeId: string;

  @PrimaryColumn('uuid')
  loyaltiesMasterVoucherId: string;

  @Column({ nullable: true })
  quantity: number;

  @ManyToOne(() => VoucherCodeDocument)
  @JoinColumn({
    name: 'loyaltiesVoucherCodeId',
    referencedColumnName: 'id',
  })
  voucher_code: VoucherCodeDocument;

  @ManyToOne(() => MasterVouchersDocument)
  @JoinColumn({
    name: 'loyaltiesMasterVoucherId',
    referencedColumnName: 'id',
  })
  master_voucher: MasterVouchersDocument;

  constructor(init?: Partial<MasterVoucherVoucherCodeDocument>) {
    Object.assign(this, init);
  }
}
