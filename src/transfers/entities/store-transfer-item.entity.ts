import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Check,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { StoreTransfer } from './store-transfer.entity';
import { ProductVariation } from '../../products/entities/product-variation.entity';

@Entity({ name: 'StoreTransferItems' })
@Check(`"quantity" > 0`)
@Index(['transferID', 'variationID'], { unique: true })
export class StoreTransferItem {
  @ApiProperty({
    description: 'ID del item en la transferencia',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  transferItemID: string;

  @ApiProperty({
    description: 'ID de la transferencia a la que pertenece',
    example: 'd8c7e96b-8d74-4b4e-9d8a-987654321012',
  })
  @Column({ type: 'uuid' })
  transferID: string;

  @ManyToOne(() => StoreTransfer, (transfer) => transfer.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transferID' })
  transfer: StoreTransfer;

  @ApiProperty({
    description: 'ID de la variante del producto',
    example: '660f9501-f30c-52e5-b827-557766551111',
  })
  @Column({ type: 'uuid' })
  variationID: string;

  @ManyToOne(() => ProductVariation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variationID' })
  variation: ProductVariation;

  @ApiProperty({
    description: 'Cantidad de unidades transferidas',
    example: 10,
    minimum: 1,
  })
  @Column('int')
  quantity: number;
}
