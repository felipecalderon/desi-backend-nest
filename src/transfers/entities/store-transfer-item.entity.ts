import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Check,
  Index,
} from 'typeorm';
import { StoreTransfer } from './store-transfer.entity';
import { ProductVariation } from '../../products/entities/product-variation.entity';

@Entity({ name: 'StoreTransferItems' })
@Check(`"quantity" > 0`)
@Index(['transferID', 'variationID'], { unique: true })
export class StoreTransferItem {
  @PrimaryGeneratedColumn('uuid')
  transferItemID: string;

  @Column({ type: 'uuid' })
  transferID: string;

  @ManyToOne(() => StoreTransfer, (transfer) => transfer.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transferID' })
  transfer: StoreTransfer;

  @Column({ type: 'uuid' })
  variationID: string;

  @ManyToOne(() => ProductVariation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variationID' })
  variation: ProductVariation;

  @Column('int')
  quantity: number;
}
