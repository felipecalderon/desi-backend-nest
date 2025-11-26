import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Sale } from './sale.entity';
import { ProductVariation } from '../../products/entities/product-variation.entity';

@Entity({ name: 'SaleProduct' })
export class SaleProduct {
  @PrimaryGeneratedColumn('uuid')
  saleProductID: string;

  @Column('uuid')
  saleID: string;

  @ManyToOne(() => Sale, (sale) => sale.saleProducts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleID' })
  sale: Sale;

  @Column('uuid')
  variationID: string;

  @ManyToOne(() => ProductVariation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variationID' })
  variation: ProductVariation;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('int')
  quantitySold: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
