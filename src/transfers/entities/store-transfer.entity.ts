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
import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    description: 'ID de la transferencia',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  transferID: string;

  @ApiProperty({
    description: 'ID de la tienda de origen',
    example: '660f9501-f30c-52e5-b827-557766551111',
  })
  @Column({ type: 'uuid' })
  originStoreID: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'originStoreID' })
  originStore: Store;

  @ApiProperty({
    description: 'ID de la tienda de destino',
    example: '770a0612-a41d-63f6-c938-668877662222',
  })
  @Column({ type: 'uuid' })
  destinationStoreID: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'destinationStoreID' })
  destinationStore: Store;

  @ApiProperty({
    description: 'Estado actual de la transferencia',
    enum: TransferStatus,
    example: TransferStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: TransferStatus,
    default: TransferStatus.PENDING,
  })
  status: TransferStatus;

  @ApiProperty({
    description: 'Lista de productos incluidos en la transferencia',
    type: () => [StoreTransferItem],
  })
  @OneToMany(() => StoreTransferItem, (item) => item.transfer, {
    cascade: true,
  })
  items: StoreTransferItem[];

  @ApiProperty({
    description: 'Fecha de creación del registro',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última modificación',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({
    description: 'Fecha y hora en que se completó la transferencia',
    required: false,
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;
}
