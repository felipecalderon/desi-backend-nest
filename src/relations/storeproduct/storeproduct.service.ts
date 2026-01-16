import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StoreProduct } from './entities/storeproduct.entity';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { UpdateStoreProductDto } from './dto/update-store-product.dto';
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
        throw new NotFoundException(
          `Tienda destino con ID ${targetStoreID} no encontrada`,
        );
      }

      // 2. Procesar cada item
      for (const item of items) {
        const { variationID, stock, priceCost } = item;

        // Validar que exista la variación (para asegurar integridad)
        const variation = await manager.findOne(ProductVariation, {
          where: { variationID },
        });

        if (!variation) {
          throw new NotFoundException(
            `Variación con ID ${variationID} no encontrada`,
          );
        }

        // --- LÓGICA DE TRANSFERENCIA ---
        // 1. Descontar de la Tienda Central (Ahora usando StoreProduct)
        const centralStore = await manager.findOne(Store, {
          where: { isCentralStore: true },
        });

        if (centralStore) {
          const centralStock = await manager.findOne(StoreProduct, {
            where: { storeID: centralStore.storeID, variationID },
            lock: { mode: 'pessimistic_write' },
          });

          if (!centralStock) {
            throw new BadRequestException(
              `No hay stock en central para la variación ${variationID}`,
            );
          }

          if (centralStock.stock < stock) {
            throw new BadRequestException(
              `Stock insuficiente en central. Solicitado: ${stock}, Disponible: ${centralStock.stock}`,
            );
          }

          centralStock.stock -= stock;
          await manager.save(centralStock);
        } else {
          // Fallback si no hay central store definida? O error?
          // Asumimos que siempre debe haber una central para sacar stock.
          throw new BadRequestException(
            'No se encontró una tienda central para descontar stock.',
          );
        }

        // 2. Agregar a Franquicia (StoreProduct)
        let storeStock = await manager.findOne(StoreProduct, {
          where: { storeID: targetStoreID, variationID },
        });

        if (!storeStock) {
          storeStock = manager.create(StoreProduct, {
            storeID: targetStoreID,
            variationID,
            priceCost,
            stock: 0,
            priceList: 0, // Inicializar precio venta en 0 o nulo
          });
        }

        storeStock.stock += stock;
        // Actualizamos costo si es relevante (promedio ponderado o último precio?)
        // Por simplicidad, actualizamos al último costo de transferencia.
        storeStock.priceCost = priceCost;

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

  async update(
    id: string,
    updateStoreProductDto: UpdateStoreProductDto,
  ): Promise<StoreProduct> {
    const storeProduct = await this.storeStockRepository.findOne({
      where: { storeProductID: id },
    });

    if (!storeProduct) {
      throw new NotFoundException(
        `Producto de tienda con ID ${id} no encontrado`,
      );
    }

    // Actualizar campos permitidos
    if (updateStoreProductDto.stock !== undefined) {
      storeProduct.stock = updateStoreProductDto.stock;
    }
    if (updateStoreProductDto.priceCost !== undefined) {
      storeProduct.priceCost = updateStoreProductDto.priceCost;
    }
    if (updateStoreProductDto.priceList !== undefined) {
      storeProduct.priceList = updateStoreProductDto.priceList;
    }

    return this.storeStockRepository.save(storeProduct);
  }
}
