import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariation } from './entities/product-variation.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Store } from '../stores/entities/store.entity';
import { StoreProduct } from '../relations/storeproduct/entities/storeproduct.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariation)
    private readonly variationRepository: Repository<ProductVariation>,
    private readonly entityManager: EntityManager,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        const { variations, ...productData } = createProductDto;

        const product = transactionalEntityManager.create(Product, productData);
        const savedProduct = await transactionalEntityManager.save(product);

        // Buscar tienda central para asociar stock inicial
        const centralStore = await transactionalEntityManager.findOne(Store, {
          where: { isCentralStore: true },
        });

        for (const variationDto of variations) {
          const variation = transactionalEntityManager.create(
            ProductVariation,
            {
              ...variationDto,
              product: savedProduct,
            },
          );
          const savedVariation =
            await transactionalEntityManager.save(variation);

          if (centralStore) {
            const sp = transactionalEntityManager.create(StoreProduct, {
              storeID: centralStore.storeID,
              variationID: savedVariation.variationID,
              stock: variationDto.stock,
              priceCost: variationDto.priceCost,
              priceList: variationDto.priceList,
            });
            await transactionalEntityManager.save(sp);
          }
        }

        return savedProduct;
      },
    );
  }

  async findAll(paginationDto: PaginationDto): Promise<Product[]> {
    const { limit = 10, offset = 0 } = paginationDto;
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: [
        'variations',
        'variations.storeProducts',
        'variations.storeProducts.store',
        'category',
      ],
    });

    return products;
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { productID: id },
      relations: [
        'variations',
        'variations.storeProducts',
        'variations.storeProducts.store',
        'category',
      ],
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const { variations, ...productData } = updateProductDto;

    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        const product = await transactionalEntityManager.findOne(Product, {
          where: { productID: id },
          relations: ['variations'],
        });

        if (!product) {
          throw new NotFoundException(`Producto con ID ${id} no encontrado`);
        }

        transactionalEntityManager.merge(Product, product, productData);
        const savedProduct = await transactionalEntityManager.save(product);

        if (variations) {
          const centralStore = await transactionalEntityManager.findOne(Store, {
            where: { isCentralStore: true },
          });

          const existingVariationsMap = new Map(
            product.variations.map((v) => [v.sku, v]),
          );

          for (const vDto of variations) {
            let variation = existingVariationsMap.get(vDto.sku);

            if (variation) {
              transactionalEntityManager.merge(
                ProductVariation,
                variation,
                vDto,
              );
              await transactionalEntityManager.save(variation);

              existingVariationsMap.delete(vDto.sku);

              if (centralStore) {
                let sp = await transactionalEntityManager.findOne(
                  StoreProduct,
                  {
                    where: {
                      storeID: centralStore.storeID,
                      variationID: variation.variationID,
                    },
                  },
                );

                if (sp) {
                  sp.stock = vDto.stock;
                  sp.priceCost = vDto.priceCost;
                  sp.priceList = vDto.priceList;
                  await transactionalEntityManager.save(sp);
                } else {
                  sp = transactionalEntityManager.create(StoreProduct, {
                    storeID: centralStore.storeID,
                    variationID: variation.variationID,
                    stock: vDto.stock,
                    priceCost: vDto.priceCost,
                    priceList: vDto.priceList,
                  });
                  await transactionalEntityManager.save(sp);
                }
              }
            } else {
              variation = transactionalEntityManager.create(ProductVariation, {
                ...vDto,
                product: savedProduct,
              });
              const savedVariation =
                await transactionalEntityManager.save(variation);

              if (centralStore) {
                const sp = transactionalEntityManager.create(StoreProduct, {
                  storeID: centralStore.storeID,
                  variationID: savedVariation.variationID,
                  stock: vDto.stock,
                  priceCost: vDto.priceCost,
                  priceList: vDto.priceList,
                });
                await transactionalEntityManager.save(sp);
              }
            }
          }

          for (const [sku, variation] of existingVariationsMap) {
            await transactionalEntityManager.remove(variation);
          }
        }

        return this.findOne(id);
      },
    );
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }
}
