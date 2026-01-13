import { Test, TestingModule } from '@nestjs/testing';
import { StoreProductService } from './storeproduct.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StoreProduct } from './entities/storeproduct.entity';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('StoreProductService', () => {
  let service: StoreProductService;
  let storeStockRepository: Repository<StoreProduct>;

  const mockStoreStockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockStoreProduct: Partial<StoreProduct> = {
    storeProductID: 'sp-uuid-1',
    storeID: 'store-uuid-1',
    variationID: 'var-uuid-1',
    quantity: 10,
    purchaseCost: 100,
    salePrice: 150,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreProductService,
        {
          provide: getRepositoryToken(StoreProduct),
          useValue: mockStoreStockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<StoreProductService>(StoreProductService);
    storeStockRepository = module.get<Repository<StoreProduct>>(
      getRepositoryToken(StoreProduct),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStoreInventory', () => {
    it('should return store inventory', async () => {
      mockStoreStockRepository.find.mockResolvedValue([mockStoreProduct]);

      const result = await service.getStoreInventory('store-uuid-1');

      expect(result).toEqual([mockStoreProduct]);
      expect(mockStoreStockRepository.find).toHaveBeenCalledWith({
        where: { storeID: 'store-uuid-1' },
        relations: ['variation', 'store'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('updateStoreProduct', () => {
    it('should update a store product', async () => {
      mockStoreStockRepository.findOne.mockResolvedValue({
        ...mockStoreProduct,
      });
      mockStoreStockRepository.save.mockResolvedValue({
        ...mockStoreProduct,
        purchaseCost: 120,
        salePrice: 180,
        quantity: 15,
      });

      const result = await service.updateStoreProduct({
        storeProductID: 'sp-uuid-1',
        purchaseCost: 120,
        salePrice: 180,
        quantity: 15,
      } as StoreProduct);

      expect(result.purchaseCost).toBe(120);
      expect(result.salePrice).toBe(180);
      expect(result.quantity).toBe(15);
    });

    it('should throw NotFoundException if store product not found', async () => {
      mockStoreStockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStoreProduct({
          storeProductID: 'not-found',
        } as StoreProduct),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('transferStock', () => {
    it('should transfer stock within a transaction', async () => {
      const mockManager = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      };

      mockDataSource.transaction.mockImplementation(async (cb) => {
        mockManager.findOne
          .mockResolvedValueOnce({ storeID: 'target-store' }) // Store
          .mockResolvedValueOnce({
            variationID: 'var-1',
            stock: 100,
            sku: 'SKU-1',
          }) // Variation
          .mockResolvedValueOnce(null); // StoreProduct (doesn't exist)

        mockManager.create.mockReturnValue({
          storeID: 'target-store',
          variationID: 'var-1',
          quantity: 0,
        });
        mockManager.save.mockResolvedValue({});

        return cb(mockManager);
      });

      await service.transferStock({
        targetStoreID: 'target-store',
        items: [{ variationID: 'var-1', quantity: 10, purchaseCost: 50 }],
      });

      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if target store not found', async () => {
      mockDataSource.transaction.mockImplementation(async (cb) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(null),
        };
        return cb(mockManager);
      });

      await expect(
        service.transferStock({
          targetStoreID: 'not-found',
          items: [],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
