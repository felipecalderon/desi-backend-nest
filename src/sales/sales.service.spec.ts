import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Sale } from './entities/sale.entity';
import { SaleProduct } from './entities/sale-product.entity';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('SalesService', () => {
  let service: SalesService;
  let saleRepository: Repository<Sale>;

  const mockSaleRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockSaleProductRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockSale: Partial<Sale> = {
    saleID: 'sale-uuid-1',
    storeID: 'store-uuid-1',
    paymentType: 'Efectivo',
    status: 'Pendiente',
    total: 1000,
    saleProducts: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: getRepositoryToken(Sale),
          useValue: mockSaleRepository,
        },
        {
          provide: getRepositoryToken(SaleProduct),
          useValue: mockSaleProductRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    saleRepository = module.get<Repository<Sale>>(getRepositoryToken(Sale));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all sales', async () => {
      mockSaleRepository.find.mockResolvedValue([mockSale]);

      const result = await service.findAll();

      expect(result).toEqual([mockSale]);
      expect(mockSaleRepository.find).toHaveBeenCalledWith({
        relations: ['store', 'saleProducts', 'saleProducts.variation'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a sale by ID', async () => {
      mockSaleRepository.findOne.mockResolvedValue(mockSale);

      const result = await service.findOne('sale-uuid-1');

      expect(result).toEqual(mockSale);
      expect(mockSaleRepository.findOne).toHaveBeenCalledWith({
        where: { saleID: 'sale-uuid-1' },
        relations: ['store', 'saleProducts', 'saleProducts.variation'],
      });
    });

    it('should throw NotFoundException if sale not found', async () => {
      mockSaleRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('not-found')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update sale status', async () => {
      mockSaleRepository.findOne.mockResolvedValue({ ...mockSale });
      mockSaleRepository.save.mockResolvedValue({
        ...mockSale,
        status: 'Completado',
      });

      const result = await service.updateStatus('sale-uuid-1', {
        status: 'Pagado',
      });

      expect(mockSaleRepository.save).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a sale within a transaction', async () => {
      const mockManager = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      };

      mockDataSource.transaction.mockImplementation(async (cb) => {
        mockManager.findOne
          .mockResolvedValueOnce({ storeID: 'store-uuid-1' }) // Store
          .mockResolvedValueOnce({
            variationID: 'var-1',
            stock: 100,
            sku: 'SKU-1',
          }) // Variation
          .mockResolvedValueOnce(null); // StoreProduct

        mockManager.create
          .mockReturnValueOnce({
            saleID: 'new-sale',
            storeID: 'store-uuid-1',
            status: 'Pendiente',
            total: 0,
          })
          .mockReturnValueOnce({ saleProductID: 'sp-1' })
          .mockReturnValueOnce({ storeProductID: 'storeproduct-1' });

        mockManager.save.mockResolvedValue({ saleID: 'new-sale' });

        return cb(mockManager);
      });

      jest.spyOn(service, 'findOne').mockResolvedValue(mockSale as Sale);

      const result = await service.create({
        storeID: 'store-uuid-1',
        paymentType: 'Efectivo',
        items: [{ variationID: 'var-1', quantity: 5, unitPrice: 200 }],
      });

      expect(mockDataSource.transaction).toHaveBeenCalled();
    });
  });
});
