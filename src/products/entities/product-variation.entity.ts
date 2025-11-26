import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity({ name: 'ProductVariations' })
export class ProductVariation {
  @PrimaryGeneratedColumn('uuid')
  variationID: string;

  @Column({ type: 'uuid' })
  productID: string;

  @ManyToOne(() => Product, (product) => product.variations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productID' })
  product: Product;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  sku: string; // Stock Keeping Unit

  @Column('decimal', { precision: 10, scale: 2 })
  priceCost: number;

  @Column('decimal', { precision: 10, scale: 2 })
  priceList: number;

  @Column('int')
  stock: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  color?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  size?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
