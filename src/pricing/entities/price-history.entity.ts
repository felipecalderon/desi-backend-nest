import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { StoreProduct } from '../../relations/storeproduct/entities/storeproduct.entity';

export enum PriceType {
  COST = 'COST',
  LIST = 'LIST',
}

@Entity({ name: 'PriceHistory' })
export class PriceHistory {
  @PrimaryGeneratedColumn('uuid')
  historyID: string;

  @Column({ type: 'uuid' })
  storeProductID: string;

  @ManyToOne(() => StoreProduct, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeProductID' })
  storeProduct: StoreProduct;

  @Column({
    type: 'enum',
    enum: PriceType,
  })
  priceType: PriceType;

  @Column('decimal', { precision: 10, scale: 2 })
  oldPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  newPrice: number;

  @Column({ type: 'varchar', nullable: true })
  reason?: string;

  @CreateDateColumn()
  effectiveDate: Date;

  @Column({ type: 'varchar', nullable: true })
  changedBy?: string;
}
