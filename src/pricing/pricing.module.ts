import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceHistory } from './entities/price-history.entity';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { SpecialOffer } from './entities/special-offer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PriceHistory, SpecialOffer])],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [TypeOrmModule, PricingService],
})
export class PricingModule {}
