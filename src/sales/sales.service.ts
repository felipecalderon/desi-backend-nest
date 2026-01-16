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

      const sale = manager.create(Sale, {
        storeID,
        paymentType,
        status: 'Pendiente',
        total: 0,
      });
      const savedSale = await manager.save(sale);

      let total = 0;

      for (const item of items) {
        const { variationID, quantity, unitPrice } = item;
        let subtotal = unitPrice * quantity;
        total += subtotal;
        const saleProduct = manager.create(SaleProduct, {
          saleID: savedSale.saleID,
          variationID,
          unitPrice,
          subtotal,
          quantitySold: quantity,
        });
        await manager.save(saleProduct);

        const storeStock = await manager.findOne(StoreProduct, {
          where: { storeID, variationID },
          lock: { mode: 'pessimistic_write' },
        });

        if (!storeStock) {
          throw new BadRequestException(
            `El producto no está asociado a la tienda (VariationID: ${variationID})`,
          );
        }

        if (storeStock.stock < quantity) {
          throw new BadRequestException(
            `Stock insuficiente en tienda para VariationID: ${variationID}. Solicitado: ${quantity}, Disponible: ${storeStock.stock}`,
          );
        }

        storeStock.stock -= quantity;
        await manager.save(storeStock);
      }

      savedSale.total = total;
      await manager.save(savedSale);

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
