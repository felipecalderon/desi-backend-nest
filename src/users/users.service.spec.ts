import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Store, StoreType } from '../stores/entities/store.entity';
import { UserStore } from '../relations/userstores/entities/userstore.entity';
import { ConfigService } from '@nestjs/config';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;

  const mockUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockUserTxRepository = {
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockStoreTxRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockUserStoreTxRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockQueryBuilder = {
    getExists: jest.fn(),
  };

  const mockManager = {
    getRepository: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockUser: Partial<User> = {
    userID: 'uuid-1',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.STORE_MANAGER,
    password: 'hashedPassword',
    userStores: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
    mockDataSource.transaction.mockImplementation(async (callback) =>
      callback(mockManager as any),
    );
    mockManager.getRepository.mockImplementation((entity) => {
      if (entity === User) return mockUserTxRepository;
      if (entity === Store) return mockStoreTxRepository;
      if (entity === UserStore) return mockUserStoreTxRepository;
      return null;
    });
    mockUserTxRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockUserTxRepository.create.mockImplementation((input) => input);
    mockUserTxRepository.save.mockImplementation(async (input) => input);
    mockStoreTxRepository.create.mockImplementation((input) => input);
    mockStoreTxRepository.findOne.mockResolvedValue({
      storeID: 'store-1',
      name: 'Store 1',
    });
    mockStoreTxRepository.save.mockImplementation(async (input) => input);
    mockUserStoreTxRepository.create.mockImplementation((input) => input);
    mockUserStoreTxRepository.save.mockImplementation(async (input) => input);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user with hashed password when users already exist', async () => {
      const createDto = {
        email: 'new@example.com',
        name: 'New User',
        role: UserRole.STORE_MANAGER,
        password: 'plainPassword',
        storeID: 'store-1',
      };

      mockQueryBuilder.getExists.mockResolvedValue(true);
      mockUserTxRepository.save.mockResolvedValue({
        ...mockUser,
        ...createDto,
        password: 'hashedPassword',
      });

      const result = await service.create(createDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword', 10);
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockQueryBuilder.getExists).toHaveBeenCalled();
      expect(mockUserTxRepository.create).toHaveBeenCalledWith({
        email: createDto.email,
        name: createDto.name,
        role: createDto.role,
        password: 'hashedPassword',
      });
      expect(mockStoreTxRepository.findOne).toHaveBeenCalledWith({
        where: { storeID: 'store-1' },
      });
      expect(mockUserStoreTxRepository.create).toHaveBeenCalledWith({
        user: expect.objectContaining({ email: createDto.email }),
        store: expect.objectContaining({ storeID: 'store-1' }),
        role: UserRole.STORE_MANAGER,
      });
      expect(result.password).toBe('hashedPassword');
    });

    it('should create the first store and associate it with the first user', async () => {
      const createDto = {
        email: 'central@example.com',
        name: 'Central User',
        role: UserRole.ADMIN,
        password: 'plainPassword',
      };

      const savedUser = {
        ...mockUser,
        ...createDto,
        password: 'hashedPassword',
      };
      const savedStore = {
        storeID: 'store-1',
        location: 'Santiago',
        rut: '11111111-1',
        address: 'Santiago',
        phone: '9999999',
        city: 'Santiago',
        storeImg: undefined,
        email: 'central@demo.com',
        name: 'Tienda de Central User',
        type: StoreType.CENTRAL,
        isCentralStore: true,
      };

      mockQueryBuilder.getExists.mockResolvedValue(false);
      mockUserTxRepository.save.mockResolvedValue(savedUser);
      mockStoreTxRepository.save.mockResolvedValue(savedStore);
      mockUserStoreTxRepository.save.mockResolvedValue({
        userStoreID: 'relation-1',
        user: savedUser,
        store: savedStore,
      });

      const result = await service.create(createDto);

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockQueryBuilder.getExists).toHaveBeenCalled();
      expect(mockStoreTxRepository.create).toHaveBeenCalledWith({
        location: 'Santiago',
        rut: '11111111-1',
        address: 'Santiago',
        phone: '9999999',
        city: 'Santiago',
        storeImg: undefined,
        email: 'central@demo.com',
        name: 'Tienda de Central User',
        type: StoreType.CENTRAL,
        isCentralStore: true,
      });
      expect(mockUserStoreTxRepository.create).toHaveBeenCalledWith({
        user: savedUser,
        store: savedStore,
        role: UserRole.ADMIN,
      });
      expect(result.userStores).toHaveLength(1);
      expect(result.userStores?.[0].store).toEqual(savedStore);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      mockUserRepository.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result).toEqual([mockUser]);
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        relations: ['userStores', 'userStores.store'],
      });
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user by email', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOneByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        relations: ['userStores', 'userStores.store'],
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOneByEmail('notfound@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneById', () => {
    it('should return a user by ID', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOneById('uuid-1');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { userID: 'uuid-1' },
        relations: ['userStores', 'userStores.store'],
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneById('not-found')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findStoresByUserId', () => {
    it('should return stores for a user', async () => {
      const userWithStores = {
        ...mockUser,
        userStores: [
          {
            store: { storeID: 'store-1', name: 'Store 1' },
            role: UserRole.STORE_MANAGER,
          },
        ],
      };
      mockUserRepository.findOne.mockResolvedValue(userWithStores);

      const result = await service.findStoresByUserId('uuid-1');

      expect(result).toEqual([
        {
          storeID: 'store-1',
          name: 'Store 1',
          role: UserRole.STORE_MANAGER,
        },
      ]);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findStoresByUserId('not-found')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser });
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        name: 'Updated Name',
      });

      const result = await service.update('uuid-1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
    });

    it('should hash password if provided in update', async () => {
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser });
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        password: 'hashedPassword',
      });

      await service.update('uuid-1', { password: 'newPassword' });

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.remove.mockResolvedValue(mockUser);

      await service.remove('uuid-1');

      expect(mockUserRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('not-found')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
