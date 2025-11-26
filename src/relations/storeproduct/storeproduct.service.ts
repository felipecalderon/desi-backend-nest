import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StoreProduct } from './entities/storeproduct.entity';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { ProductVariation } from '../../products/entities/product-variation.entity';
import { Store } from '../../stores/entities/store.entity';

@Injectable()
export class StoreProductService {
  constructor(
    @InjectRepository(StoreProduct)
    private readonly storeStockRepository: Repository<StoreProduct>,
    private readonly dataSource: DataSource,
  ) {}

  async transferStock(transferStockDto: TransferStockDto): Promise<void> {
    const { targetStoreID, items } = transferStockDto;

    await this.dataSource.transaction(async (manager) => {
      // 1. Verificar tienda destino
      const targetStore = await manager.findOne(Store, {
        where: { storeID: targetStoreID },
      });
      if (!targetStore) {
        throw new NotFoundException(`Tienda destino con ID ${targetStoreID} no encontrada`);
      }

      // 2. Procesar cada item
      for (const item of items) {
        const { variationID, quantity, purchaseCost } = item;

        // Bloquear y obtener variación (Central Stock)
        const variation = await manager.findOne(ProductVariation, {
          where: { variationID },
          lock: { mode: 'pessimistic_write' }, // Evitar condiciones de carrera
        });

        if (!variation) {
          throw new NotFoundException(`Variación con ID ${variationID} no encontrada`);
        }

        if (variation.stock < quantity) {
          throw new BadRequestException(
            `Stock insuficiente en central para la variación de SKU: ${variation.sku}. Solicitado: ${quantity}, Disponible: ${variation.stock}`,
          );
        }

        // Descontar de Central
        variation.stock -= quantity;
        await manager.save(variation);

        // Agregar a Franquicia (StoreProduct)
        let storeStock = await manager.findOne(StoreProduct, {
          where: { storeID: targetStoreID, variationID },
        });

        if (!storeStock) {
          storeStock = manager.create(StoreProduct, {
            storeID: targetStoreID,
            variationID,
            purchaseCost,
            quantity: 0,
          });
        }

        storeStock.quantity += quantity;
        await manager.save(storeStock);
      }
    });
  }

  async getStoreInventory(storeID: string): Promise<StoreProduct[]> {
    return this.storeStockRepository.find({
      where: { storeID },
      relations: ['variation', 'store'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStoreProduct(
    storeProduct: StoreProduct,
  ): Promise<StoreProduct> {
    const storeProductDB = await this.storeStockRepository.findOne({
      where: { storeProductID: storeProduct.storeProductID },
    });

    if (!storeProductDB) {
      throw new NotFoundException(
        `Producto de tienda con ID ${storeProduct.storeProductID} no encontrado`,
      );
    }

    storeProductDB.purchaseCost = storeProduct.purchaseCost;
    storeProductDB.salePrice = storeProduct.salePrice;
    storeProductDB.quantity = storeProduct.quantity;
    return this.storeStockRepository.save(storeProductDB);
  }
}
