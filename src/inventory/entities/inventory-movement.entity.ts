import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { ProductVariation } from '../../products/entities/product-variation.entity';

export enum InventoryMovementReason {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
}

@Entity({ name: 'InventoryMovements' })
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  movementID: string;

  @Column({ type: 'uuid' })
  storeID: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeID' })
  store: Store;

  @Column({ type: 'uuid' })
  variationID: string;

  @ManyToOne(() => ProductVariation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variationID' })
  variation: ProductVariation;

  @Column('int')
  delta: number;

  @Column({
    type: 'enum',
    enum: InventoryMovementReason,
  })
  reason: InventoryMovementReason;

  @Column({ type: 'varchar', nullable: true })
  referenceID?: string;

  @CreateDateColumn()
  createdAt: Date;
}
