import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StoreProduct } from './entities/storeproduct.entity';
import { Product } from '../../products/entities/product.entity';
import {
  DiscountType,
  SpecialOffer,
} from '../../pricing/entities/special-offer.entity';
import { LessThanOrEqual, MoreThanOrEqual, IsNull } from 'typeorm';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { UpdateStoreProductDto } from './dto/update-store-product.dto';
import { ProductVariation } from '../../products/entities/product-variation.entity';
import { Store } from '../../stores/entities/store.entity';

@Injectable()
export class StoreProductService {
  constructor(
    @InjectRepository(StoreProduct)
    private readonly storeStockRepository: Repository<StoreProduct>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
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

  async getStoreInventory(storeID: string): Promise<Product[]> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .innerJoinAndSelect('product.variations', 'variations')
      .innerJoinAndSelect(
        'variations.storeProducts',
        'storeProducts',
        'storeProducts.storeID = :storeID',
        { storeID },
      )
      .leftJoinAndSelect('storeProducts.store', 'store')
      .leftJoinAndSelect(
        'storeProducts.specialOffers',
        'offer',
        '(offer.isActive = :isActive AND (offer.endDate IS NULL OR offer.endDate >= :now) AND offer.startDate <= :now)',
        { isActive: true, now: new Date() },
      )
      .getMany();

    // Calculate final prices
    for (const product of products) {
      for (const variation of product.variations) {
        for (const sp of variation.storeProducts) {
          // Logic similar to PricingService.calculateFinalPrice
          // We assume we fetched active offers.
          // Pick the best/latest offer if multiple (though SQL filter might return multiple)
          // Sort offers by startDate DESC to get latest
          const offers = sp['specialOffers'] || []; // TypeORM relation
          const activeOffer = offers.sort(
            (a, b) => b.startDate.getTime() - a.startDate.getTime(),
          )[0];

          let finalPrice = Number(sp.priceList) || 0;
          let discountApplied = false;
          let discountDetails = null;

          if (activeOffer) {
            const originalPrice = finalPrice;
            switch (activeOffer.discountType) {
              case DiscountType.PERCENTAGE:
                finalPrice = originalPrice * (1 - activeOffer.value / 100);
                break;
              case DiscountType.FIXED_AMOUNT:
                finalPrice = Math.max(0, originalPrice - activeOffer.value);
                break;
              case DiscountType.FIXED_PRICE:
                finalPrice = Number(activeOffer.value);
                break;
            }
            finalPrice = Math.round(finalPrice * 100) / 100;
            discountApplied = true;
            discountDetails = {
              offerID: activeOffer.offerID,
              description: activeOffer.description,
              type: activeOffer.discountType,
              value: activeOffer.value,
            };
          }

          // Attach to StoreProduct object (as non-entity properties for JSON response)
          // We can cast to any to attach extra props.
          (sp as any).finalPrice = finalPrice;
          (sp as any).discountApplied = discountApplied;
          (sp as any).activeOffer = discountDetails;

          // Remove specialOffers list from response to keep it clean if desired?
          // delete (sp as any).specialOffers;
        }
      }
    }

    return products;
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
