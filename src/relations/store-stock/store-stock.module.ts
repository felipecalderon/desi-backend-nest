import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreStockService } from './store-stock.service';
import { StoreStockController } from './store-stock.controller';
import { StoreProduct } from './entities/store-stock.entity';
import { ProductVariation } from '../../products/entities/product-variation.entity';
import { Store } from '../../stores/entities/store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StoreProduct, ProductVariation, Store])],
  controllers: [StoreStockController],
  providers: [StoreStockService],
})
export class StoreStockModule {}
