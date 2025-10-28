import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariation } from './entities/product-variation.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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

        const variationEntities = variations.map((variationDto) =>
          transactionalEntityManager.create(ProductVariation, {
            ...variationDto,
            product: savedProduct,
          }),
        );
        await transactionalEntityManager.save(variationEntities);

        return savedProduct;
      },
    );
  }

  findAll(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ['variations', 'category'],
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { productID: id },
      relations: ['variations', 'category'],
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
    const product = await this.findOne(id);
    // Nota: La lógica para actualizar/añadir/eliminar variantes se manejará aquí
    const { variations, ...productData } = updateProductDto;
    this.productRepository.merge(product, productData);
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }
}
