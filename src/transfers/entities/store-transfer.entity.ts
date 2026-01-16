import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Check,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { StoreTransferItem } from './store-transfer-item.entity';

export enum TransferStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'StoreTransfers' })
@Check(`"originStoreID" <> "destinationStoreID"`)
export class StoreTransfer {
  @PrimaryGeneratedColumn('uuid')
  transferID: string;

  @Column({ type: 'uuid' })
  originStoreID: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'originStoreID' })
  originStore: Store;

  @Column({ type: 'uuid' })
  destinationStoreID: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'destinationStoreID' })
  destinationStore: Store;

  @Column({
    type: 'enum',
    enum: TransferStatus,
    default: TransferStatus.PENDING,
  })
  status: TransferStatus;

  @OneToMany(() => StoreTransferItem, (item) => item.transfer, {
    cascade: true,
  })
  items: StoreTransferItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;
}
