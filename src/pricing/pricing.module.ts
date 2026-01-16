import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceHistory } from './entities/price-history.entity';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PriceHistory])],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [TypeOrmModule, PricingService],
})
export class PricingModule {}
