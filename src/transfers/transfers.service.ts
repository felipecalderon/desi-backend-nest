import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  StoreTransfer,
  TransferStatus,
} from './entities/store-transfer.entity';
import { StoreTransferItem } from './entities/store-transfer-item.entity';
import { CreateStoreTransferDto } from './dto/create-store-transfer.dto';
import { AddTransferItemDto } from './dto/add-transfer-item.dto';
import { InventoryService } from '../inventory/inventory.service';
import { InventoryMovementReason } from '../inventory/entities/inventory-movement.entity';

@Injectable()
export class TransfersService {
  constructor(
    @InjectRepository(StoreTransfer)
    private readonly transfersRepository: Repository<StoreTransfer>,
    @InjectRepository(StoreTransferItem)
    private readonly transferItemsRepository: Repository<StoreTransferItem>,
    private readonly inventoryService: InventoryService,
    private readonly dataSource: DataSource,
  ) {}

  async createTransfer(
    createDto: CreateStoreTransferDto,
  ): Promise<StoreTransfer> {
    if (createDto.originStoreID === createDto.destinationStoreID) {
      throw new BadRequestException(
        'Origin and Destination stores must be different',
      );
    }
    const transfer = this.transfersRepository.create(createDto);
    return this.transfersRepository.save(transfer);
  }

  async addItem(
    transferID: string,
    addItemDto: AddTransferItemDto,
  ): Promise<StoreTransferItem> {
    const transfer = await this.transfersRepository.findOne({
      where: { transferID },
    });
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException(
        'Cannot add items to a non-pending transfer',
      );
    }

    const item = this.transferItemsRepository.create({
      transferID,
      ...addItemDto,
    });
    return this.transferItemsRepository.save(item);
  }

  async completeTransfer(transferID: string): Promise<StoreTransfer> {
    return this.dataSource.transaction(async (manager) => {
      const transfer = await manager.findOne(StoreTransfer, {
        where: { transferID },
        relations: ['items'],
      });

      if (!transfer) throw new NotFoundException('Transfer not found');
      if (transfer.status !== TransferStatus.PENDING) {
        throw new BadRequestException('Transfer is not pending');
      }
      if (!transfer.items || transfer.items.length === 0) {
        throw new BadRequestException('Transfer has no items');
      }

      for (const item of transfer.items) {
        await this.inventoryService.createMovement({
          storeID: transfer.originStoreID,
          variationID: item.variationID,
          quantity: item.quantity,
          reason: InventoryMovementReason.TRANSFER_OUT,
          referenceID: transfer.transferID,
        });

        await this.inventoryService.createMovement({
          storeID: transfer.destinationStoreID,
          variationID: item.variationID,
          quantity: item.quantity,
          reason: InventoryMovementReason.TRANSFER_IN,
          referenceID: transfer.transferID,
        });
      }

      transfer.status = TransferStatus.COMPLETED;
      transfer.completedAt = new Date();

      return manager.save(transfer);
    });
  }

  async getTransfer(transferID: string) {
    return this.transfersRepository.findOne({
      where: { transferID },
      relations: [
        'items',
        'items.variation',
        'originStore',
        'destinationStore',
      ],
    });
  }
}
