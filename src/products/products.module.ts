import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { ProductVariation } from './entities/product-variation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductVariation])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
