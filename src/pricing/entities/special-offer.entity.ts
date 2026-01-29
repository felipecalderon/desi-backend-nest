import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StoreProduct } from '../../relations/storeproduct/entities/storeproduct.entity';

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE', // e.g., 20% off
  FIXED_AMOUNT = 'FIXED_AMOUNT', // e.g., $5000 off
  FIXED_PRICE = 'FIXED_PRICE', // e.g., Final price $9990
}

@Entity({ name: 'SpecialOffer' })
export class SpecialOffer {
  @PrimaryGeneratedColumn('uuid')
  offerID: string;

  @Column({ type: 'uuid' })
  storeProductID: string;

  @ManyToOne(() => StoreProduct, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeProductID' })
  storeProduct: StoreProduct;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: DiscountType,
  })
  discountType: DiscountType;

  @Column('decimal', { precision: 10, scale: 2 })
  value: number;

  @Column({ type: 'timestamp with time zone' })
  startDate: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  endDate?: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
