import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Store } from '../../../stores/entities/store.entity';
import { ProductVariation } from '../../../products/entities/product-variation.entity';

@Entity({ name: 'StoreProduct' })
@Index(['variationID', 'storeID'], { unique: true })
export class StoreProduct {
  @PrimaryGeneratedColumn('uuid')
  storeProductID: string;

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

  /**
   * @deprecated logic should use InventoryMovements as source of truth.
   * This field is a CACHE / READ MODEL derived from movements.
   */
  @Column('int', { default: 0 })
  stock: number;

  @Column('decimal', { precision: 10, scale: 2 })
  priceCost: number; // Precio al que la tienda compró este producto

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  priceList?: number; // Precio de venta en la tienda

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
