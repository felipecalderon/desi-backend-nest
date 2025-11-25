import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariation } from './entities/product-variation.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

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

  findAll(paginationDto: PaginationDto): Promise<Product[]> {
    const { limit = 10, offset = 0 } = paginationDto;
    return this.productRepository.find({
      take: limit,
      skip: offset,
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
          // Eliminar variaciones existentes si se proporcionan nuevas (estrategia simple de reemplazo)
          // O implementar lógica de diffing más compleja si se requiere
          // Aquí optaremos por eliminar las anteriores y crear las nuevas para simplificar
          // PERO, si se quiere mantener IDs, habría que comparar.
          // Dado el comentario "Nota: La lógica para actualizar...", haremos un enfoque robusto:
          // Borrar las que no están, actualizar las que están, crear las nuevas.
          // Por simplicidad y seguridad en este paso, reemplazaremos todas si se envía el array.

          await transactionalEntityManager.delete(ProductVariation, {
            product: { productID: id },
          });

          const newVariations = variations.map((v) =>
            transactionalEntityManager.create(ProductVariation, {
              ...v,
              product: savedProduct,
            }),
          );
          await transactionalEntityManager.save(newVariations);
        }

        return this.findOne(id); // Retornar el producto actualizado con relaciones
      },
    );
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }
}
