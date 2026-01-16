import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PriceHistory, PriceType } from './entities/price-history.entity';
import { UpdatePriceDto } from './dto/update-price.dto';
import { StoreProduct } from '../relations/storeproduct/entities/storeproduct.entity';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(PriceHistory)
    private readonly priceHistoryRepository: Repository<PriceHistory>,
    private readonly dataSource: DataSource,
  ) {}

  async updatePrice(updatePriceDto: UpdatePriceDto): Promise<PriceHistory> {
    const { storeID, variationID, priceType, newPrice, reason, changedBy } =
      updatePriceDto;

    return this.dataSource.transaction(async (manager) => {
      let storeProduct = await manager.findOne(StoreProduct, {
        where: { storeID, variationID },
      });

      if (!storeProduct) {
        storeProduct = manager.create(StoreProduct, {
          storeID,
          variationID,
          stock: 0,
          priceCost: 0,
          priceList: 0,
        });
      }

      const oldPrice =
        priceType === PriceType.COST
          ? storeProduct.priceCost
          : (storeProduct.priceList ?? 0);

      const history = manager.create(PriceHistory, {
        storeProduct,
        priceType,
        oldPrice,
        newPrice,
        reason,
        changedBy,
      });
      const savedHistory = await manager.save(history);

      if (priceType === PriceType.COST) {
        storeProduct.priceCost = newPrice;
      } else {
        storeProduct.priceList = newPrice;
      }
      await manager.save(storeProduct);

      return savedHistory;
    });
  }

  async getPriceHistory(storeID: string, variationID: string) {
    return this.priceHistoryRepository.find({
      where: {
        storeProduct: {
          storeID,
          variationID,
        },
      },
      order: { effectiveDate: 'DESC' },
    });
  }
}
