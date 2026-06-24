import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Store, StoreType } from '../stores/entities/store.entity';
import { UserStore } from '../relations/userstores/entities/userstore.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.ensureMasterUser();
  }

  async create(dto: CreateUserDto): Promise<User> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    return this.dataSource.transaction(async (manager) => {
      const { storeID, ...userData } = dto;
      const userRepository = manager.getRepository(User);
      const hasUsers = await userRepository
        .createQueryBuilder('user')
        .getExists();

      if (dto.role !== UserRole.SUPER_ADMIN && hasUsers && !storeID) {
        throw new BadRequestException(
          'storeID is required for non-super-admin users',
        );
      }

      const user = userRepository.create({
        ...userData,
        password: hashedPassword,
      });

      const savedUser = await userRepository.save(user);

      if (dto.role === UserRole.SUPER_ADMIN) {
        return savedUser;
      }

      if (!hasUsers || storeID) {
        const storeRepository = manager.getRepository(Store);
        const userStoreRepository = manager.getRepository(UserStore);

        const savedStore = storeID
          ? await storeRepository.findOne({ where: { storeID } })
          : await storeRepository.save(
              storeRepository.create({
                location: 'Santiago',
                rut: '11111111-1',
                address: 'Santiago',
                phone: '9999999',
                city: 'Santiago',
                storeImg: undefined,
                email: 'central@demo.com',
                name: `Tienda de ${dto.name}`,
                type: StoreType.CENTRAL,
                isCentralStore: true,
              }),
            );

        if (!savedStore) {
          throw new NotFoundException(`Store with ID ${storeID} not found`);
        }

        const userStore = userStoreRepository.create({
          user: savedUser,
          store: savedStore,
          role: dto.role,
        });

        await userStoreRepository.save(userStore);
        savedUser.userStores = [userStore];
      }

      return savedUser;
    });
  }

  async findAll(storeID?: string): Promise<User[]> {
    return this.userRepo.find({
      ...(storeID
        ? { where: { userStores: { store: { storeID } } } }
        : {}),
      relations: ['userStores', 'userStores.store'],
    });
  }

  async findOneByEmail(email: string, storeID?: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: {
        email,
        ...(storeID ? { userStores: { store: { storeID } } } : {}),
      },
      relations: ['userStores', 'userStores.store'],
    });
    if (!user)
      throw new NotFoundException(`User with email ${email} not found`);
    return user;
  }

  async findOneById(id: string, storeID?: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: {
        userID: id,
        ...(storeID ? { userStores: { store: { storeID } } } : {}),
      },
      relations: ['userStores', 'userStores.store'],
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async findStoresByUserId(id: string, activeStoreID?: string): Promise<any> {
    const user = await this.userRepo.findOne({
      where: { userID: id },
      relations: ['userStores', 'userStores.store'],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user.userStores
      .filter(
        (userStore) =>
          !activeStoreID || userStore.store.storeID === activeStoreID,
      )
      .map((userStore) => ({
      ...userStore.store,
      role: userStore.role,
    }));
  }

  async update(id: string, dto: UpdateUserDto, storeID?: string): Promise<User> {
    const user = await this.findOneById(id, storeID);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    if (dto.password) {
      const saltRounds = 10;
      dto.password = await bcrypt.hash(dto.password, saltRounds);
    }

    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async remove(id: string, storeID?: string): Promise<void> {
    const user = await this.findOneById(id, storeID);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    await this.userRepo.remove(user);
  }

  private async ensureMasterUser(): Promise<void> {
    const email = this.configService.get<string>('MASTER_ADMIN_EMAIL');
    const password = this.configService.get<string>('MASTER_ADMIN_PASSWORD');
    const name = this.configService.get<string>('MASTER_ADMIN_NAME', 'Master');

    if (!email || !password) {
      return;
    }

    const existingMaster = await this.userRepo.findOne({ where: { email } });
    if (existingMaster) {
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const master = this.userRepo.create({
      email,
      name,
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
    });

    await this.userRepo.save(master);
    this.logger.log(`Master user created: ${email}`);
  }
}
