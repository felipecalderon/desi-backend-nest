import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { SaleProduct } from './entities/sale-product.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleStatusDto } from './dto/update-sale-status.dto';
import { ProductVariation } from '../products/entities/product-variation.entity';
import { Store } from '../stores/entities/store.entity';
import { StoreProduct } from '../relations/storeproduct/entities/storeproduct.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleProduct)
    private readonly saleProductRepository: Repository<SaleProduct>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createSaleDto: CreateSaleDto): Promise<Sale> {
    const { storeID, paymentType, items } = createSaleDto;

    return this.dataSource.transaction(async (manager) => {
      // 1. Verificar tienda destino
      const targetStore = await manager.findOne(Store, {
        where: { storeID },
      });
      if (!targetStore) {
        throw new NotFoundException(`Tienda con ID ${storeID} no encontrada`);
      }

      // 2. Crear la venta (inicialmente en Pendiente)
      const sale = manager.create(Sale, {
        storeID,
        paymentType,
        status: 'Pendiente',
        total: 0,
      });
      const savedSale = await manager.save(sale);

      let total = 0;

      // 3. Procesar cada item
      for (const item of items) {
        const { variationID, quantity, unitPrice } = item;

        // Bloquear y obtener variación (Central Stock)
        const variation = await manager.findOne(ProductVariation, {
          where: { variationID },
          lock: { mode: 'pessimistic_write' },
        });

        if (!variation) {
          throw new NotFoundException(
            `Variación con ID ${variationID} no encontrada`,
          );
        }

        if (variation.stock < quantity) {
          throw new BadRequestException(
            `Stock insuficiente en central para SKU: ${variation.sku}. Solicitado: ${quantity}, Disponible: ${variation.stock}`,
          );
        }

        // Calcular subtotal
        const subtotal = unitPrice * quantity;
        total += subtotal;

        // Crear SaleProduct
        const saleProduct = manager.create(SaleProduct, {
          saleID: savedSale.saleID,
          variationID,
          unitPrice,
          subtotal,
          quantitySold: quantity,
        });
        await manager.save(saleProduct);

        // Descontar de Central
        variation.stock -= quantity;
        await manager.save(variation);

        // Agregar a StoreProduct de la tienda
        let storeStock = await manager.findOne(StoreProduct, {
          where: { storeID, variationID },
        });

        if (!storeStock) {
          storeStock = manager.create(StoreProduct, {
            storeID,
            variationID,
            quantity: 0,
            purchaseCost: unitPrice,
          });
        } else {
          // Actualizar precio promedio ponderado (opcional, por ahora solo actualizamos)
          storeStock.purchaseCost = unitPrice;
        }

        storeStock.quantity += quantity;
        await manager.save(storeStock);
      }

      // 4. Actualizar total de la venta
      savedSale.total = total;
      await manager.save(savedSale);

      // 5. Retornar venta con relaciones
      return this.findOne(savedSale.saleID);
    });
  }

  findAll(): Promise<Sale[]> {
    return this.saleRepository.find({
      relations: ['store', 'saleProducts', 'saleProducts.variation'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { saleID: id },
      relations: ['store', 'saleProducts', 'saleProducts.variation'],
    });
    if (!sale) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }
    return sale;
  }

  async updateStatus(
    id: string,
    updateSaleStatusDto: UpdateSaleStatusDto,
  ): Promise<Sale> {
    const sale = await this.findOne(id);
    sale.status = updateSaleStatusDto.status;
    await this.saleRepository.save(sale);
    return this.findOne(id);
  }
}
