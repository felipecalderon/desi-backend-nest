import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductVariation } from './entities/product-variation.entity';
import { EntityManager, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { UpdateProductDto } from './dto/update-product.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: Repository<Product>;
  let entityManager: EntityManager;

  const mockProductRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
  };

  const mockVariationRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockEntityManager = {
    transaction: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository as any,
        },
        {
          provide: getRepositoryToken(ProductVariation),
          useValue: mockVariationRepository as any,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager as any,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    entityManager = module.get<EntityManager>(EntityManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of products with pagination', async () => {
      const result: Product[] = [];
      mockProductRepository.find.mockResolvedValue(result);

      const paginationDto = { limit: 10, offset: 0 };
      expect(await service.findAll(paginationDto)).toBe(result);
      expect(mockProductRepository.find).toHaveBeenCalledWith({
        take: 10,
        skip: 0,
        relations: ['variations', 'category'],
      });
    });
  });

  describe('update', () => {
    it('should update a product and its variations', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Updated Product',
        variations: [{ size: 'L', priceCost: 80, priceList: 100, stock: 10, sku: "123" }],
      };
      const existingProduct = { productID: '1', name: 'Old Product' };
      const updatedProduct = { ...existingProduct, ...updateDto };

      mockEntityManager.transaction.mockImplementation(async (cb) => {
        return cb(mockEntityManager as any);
      });
      mockEntityManager.findOne.mockResolvedValue(existingProduct);
      mockEntityManager.save.mockResolvedValue(updatedProduct);
      // Mock findOne called at the end of update
      jest.spyOn(service, 'findOne').mockResolvedValue(updatedProduct as any);

      const result = await service.update('1', updateDto);

      expect(result).toEqual(updatedProduct);
      expect(mockEntityManager.transaction).toHaveBeenCalled();
      expect(mockEntityManager.delete).toHaveBeenCalledWith(ProductVariation, {
        product: { productID: '1' },
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockEntityManager.transaction.mockImplementation(async (cb) => {
        return cb(mockEntityManager as any);
      });
      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(service.update('1', {})).rejects.toThrow(NotFoundException);
    });
  });
});
