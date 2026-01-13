import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesService } from './expenses.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Expense, ExpenseType } from './entities/expense.entity';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ExpensesService', () => {
  let service: ExpensesService;
  let expenseRepository: Repository<Expense>;

  const mockExpenseRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockExpense: Partial<Expense> = {
    id: 'expense-uuid-1',
    name: 'Office Rent',
    deductibleDate: new Date('2023-10-27T00:00:00Z'),
    amount: 1500.5,
    type: ExpenseType.ADMINISTRATIVE,
    storeID: 'store-uuid-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        {
          provide: getRepositoryToken(Expense),
          useValue: mockExpenseRepository,
        },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
    expenseRepository = module.get<Repository<Expense>>(
      getRepositoryToken(Expense),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an expense', async () => {
      const createDto = {
        name: 'Office Supplies',
        deductibleDate: '2023-11-01T00:00:00Z',
        amount: 250.0,
        type: ExpenseType.OPERATIONAL,
        storeID: 'store-uuid-1',
      };

      mockExpenseRepository.create.mockReturnValue({ ...createDto });
      mockExpenseRepository.save.mockResolvedValue({
        id: 'new-expense-uuid',
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(mockExpenseRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockExpenseRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'new-expense-uuid');
    });

    it('should throw BadRequestException on save error', async () => {
      const createDto = {
        name: 'Bad Expense',
        deductibleDate: '2023-11-01T00:00:00Z',
        amount: 100,
        type: ExpenseType.FINANCIAL,
        storeID: 'store-uuid-1',
      };

      mockExpenseRepository.create.mockReturnValue(createDto);
      mockExpenseRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of expenses with store relation', async () => {
      mockExpenseRepository.find.mockResolvedValue([mockExpense]);

      const result = await service.findAll();

      expect(result).toEqual([mockExpense]);
      expect(mockExpenseRepository.find).toHaveBeenCalledWith({
        relations: ['store'],
      });
    });
  });

  describe('findOne', () => {
    it('should return an expense by ID', async () => {
      mockExpenseRepository.findOne.mockResolvedValue(mockExpense);

      const result = await service.findOne('expense-uuid-1');

      expect(result).toEqual(mockExpense);
      expect(mockExpenseRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'expense-uuid-1' },
        relations: ['store'],
      });
    });

    it('should throw NotFoundException if expense not found', async () => {
      mockExpenseRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('not-found')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an expense', async () => {
      mockExpenseRepository.findOne.mockResolvedValue({ ...mockExpense });
      mockExpenseRepository.save.mockResolvedValue({
        ...mockExpense,
        name: 'Updated Office Rent',
      });

      const result = await service.update('expense-uuid-1', {
        name: 'Updated Office Rent',
      });

      expect(result.name).toBe('Updated Office Rent');
      expect(mockExpenseRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if expense to update not found', async () => {
      mockExpenseRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('not-found', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an expense', async () => {
      mockExpenseRepository.findOne.mockResolvedValue(mockExpense);
      mockExpenseRepository.remove.mockResolvedValue(mockExpense);

      await service.remove('expense-uuid-1');

      expect(mockExpenseRepository.remove).toHaveBeenCalledWith(mockExpense);
    });

    it('should throw NotFoundException if expense to remove not found', async () => {
      mockExpenseRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('not-found')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
