import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PriceHistory, PriceType } from './entities/price-history.entity';
import { UpdatePriceDto } from './dto/update-price.dto';
import { StoreProduct } from '../relations/storeproduct/entities/storeproduct.entity';
import { SpecialOffer, DiscountType } from './entities/special-offer.entity';
import { CreateSpecialOfferDto } from './dto/create-special-offer.dto';
import { UpdateSpecialOfferDto } from './dto/update-special-offer.dto';
import { LessThanOrEqual, MoreThanOrEqual, IsNull } from 'typeorm';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(PriceHistory)
    private readonly priceHistoryRepository: Repository<PriceHistory>,
    @InjectRepository(SpecialOffer)
    private readonly specialOfferRepository: Repository<SpecialOffer>,
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

  // --- SPECIAL OFFERS ---

  async createSpecialOffer(
    createSpecialOfferDto: CreateSpecialOfferDto,
  ): Promise<SpecialOffer> {
    const { storeProductID, startDate, endDate } = createSpecialOfferDto;

    // Check for overlapping active offers
    const overlappingDetails = await this.checkOverlap(
      storeProductID,
      startDate,
      endDate,
    );
    if (overlappingDetails) {
      throw new BadRequestException(
        `No se puede crear la oferta. Se solapa con la oferta existente ${overlappingDetails.offerID} (${overlappingDetails.startDate} - ${overlappingDetails.endDate})`,
      );
    }

    const offer = this.specialOfferRepository.create(createSpecialOfferDto);
    return this.specialOfferRepository.save(offer);
  }

  private async checkOverlap(
    storeProductID: string,
    startDateStr: string,
    endDateStr?: string,
  ): Promise<SpecialOffer | null> {
    const start = new Date(startDateStr);
    const end = endDateStr ? new Date(endDateStr) : null;

    // Base Query: Same store product and active
    const query = this.specialOfferRepository
      .createQueryBuilder('offer')
      .where('offer.storeProductID = :storeProductID', { storeProductID })
      .andWhere('offer.isActive = :isActive', { isActive: true });

    // Overlap Logic:
    // (StartA <= EndB) and (EndA >= StartB)
    // If EndB is null (infinity), then (EndA >= StartB) is enough? No.

    // Existing Offer (A), New Offer (B)
    // A.start <= B.end AND (A.end IS NULL OR A.end >= B.start)

    if (end) {
      // New offer has specific end date
      query.andWhere(
        '(offer.startDate <= :end) AND (offer.endDate IS NULL OR offer.endDate >= :start)',
        { start, end },
      );
    } else {
      // New offer is infinite (endDate is null)
      // Overlaps if Existing Offer ends AFTER new start, or is infinite
      query.andWhere('(offer.endDate IS NULL OR offer.endDate >= :start)', {
        start,
      });
    }

    return query.getOne();
  }

  async updateSpecialOffer(
    offerID: string,
    updateSpecialOfferDto: UpdateSpecialOfferDto,
  ): Promise<SpecialOffer> {
    const offer = await this.specialOfferRepository.findOne({
      where: { offerID },
    });
    if (!offer) throw new NotFoundException('Oferta especial no encontrada');

    Object.assign(offer, updateSpecialOfferDto);
    return this.specialOfferRepository.save(offer);
  }

  async getActiveOffer(storeProductID: string): Promise<SpecialOffer | null> {
    const now = new Date();

    // Find checking dates and active status.
    // If multiple active offers exist (e.g. overlapping), we need a strategy.
    // Strategy: Take the one with the latest start date (most recent).
    // Alternatively, we could pick the "best discount". For now, let's pick the most recent one.

    const offers = await this.specialOfferRepository.find({
      where: [
        // Case 1: endDate is defined
        {
          storeProductID,
          isActive: true,
          startDate: LessThanOrEqual(now),
          endDate: MoreThanOrEqual(now),
        },
        // Case 2: endDate is null (indefinite)
        {
          storeProductID,
          isActive: true,
          startDate: LessThanOrEqual(now),
          endDate: IsNull(),
        },
      ],
      order: {
        startDate: 'DESC',
      },
      take: 1,
    });

    return offers.length > 0 ? offers[0] : null;
  }

  async calculateFinalPrice(storeProductID: string) {
    // 1. Get Base Price
    // We need to fetch the StoreProduct to get the list price.
    // Since we don't have StoreProductRepository injected here, we can use dataSource or just a relation query if we had one.
    // Let's rely on the module having access or fetching via DataSource as done in updatePrice.

    const storeProduct = await this.dataSource.manager.findOne(StoreProduct, {
      where: { storeProductID },
    });

    if (!storeProduct) {
      throw new NotFoundException('Producto de tienda no encontrado');
    }

    const originalPrice = Number(storeProduct.priceList) || 0;

    // 2. Get Active Offer
    const activeOffer = await this.getActiveOffer(storeProductID);

    if (!activeOffer) {
      return {
        originalPrice,
        finalPrice: originalPrice,
        discountApplied: false,
        discountDetails: null,
      };
    }

    // 3. Calculate Discount
    let finalPrice = originalPrice;

    switch (activeOffer.discountType) {
      case DiscountType.PERCENTAGE:
        // Value is percentage, e.g. 20 for 20%
        finalPrice = originalPrice * (1 - activeOffer.value / 100);
        break;
      case DiscountType.FIXED_AMOUNT:
        // Value is amount to subtract, e.g. 1000
        finalPrice = Math.max(0, originalPrice - activeOffer.value);
        break;
      case DiscountType.FIXED_PRICE:
        // Value is the new price
        finalPrice = activeOffer.value;
        break;
    }

    // Round to 2 decimals if needed, but for currency usually integer or 2 decimals.
    finalPrice = Math.round(finalPrice * 100) / 100;

    return {
      originalPrice,
      finalPrice,
      discountApplied: true,
      discountDetails: {
        offerID: activeOffer.offerID,
        description: activeOffer.description,
        type: activeOffer.discountType,
        value: activeOffer.value,
      },
    };
  }
}
