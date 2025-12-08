import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { ProductVariation } from '../../products/entities/product-variation.entity';

@Entity({ name: 'PurchaseOrderItem' })
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn('uuid')
  purchaseOrderItemID: string;

  @Column('uuid')
  purchaseOrderID: string;

  @ManyToOne(() => PurchaseOrder, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'purchaseOrderID' })
  purchaseOrder: PurchaseOrder;

  @Column('uuid')
  variationID: string;

  @ManyToOne(() => ProductVariation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variationID' })
  variation: ProductVariation;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 12, scale: 2 })
  subtotal: number;

  @Column('int')
  quantityRequested: number;

  @Column('int', { default: 0 })
  quantityReceived: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
