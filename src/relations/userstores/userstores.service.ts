import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStore } from './entities/userstore.entity';
import { CreateUserstoreDto } from './dto/create-userstore.dto';
import { UsersService } from '../../users/users.service';
import { StoresService } from '../../stores/stores.service';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class UserstoresService {
  constructor(
    @InjectRepository(UserStore)
    private readonly userStoreRepo: Repository<UserStore>,
    private readonly usersService: UsersService,
    private readonly storesService: StoresService,
  ) {}

  async create(dto: CreateUserstoreDto, activeStoreID?: string): Promise<UserStore> {
    const { userID, storeID } = dto;
    const scopedStoreID = activeStoreID ?? storeID;

    // Verificar si el usuario y la tienda existen
    const user = await this.usersService.findOneById(userID);
    if (!user) {
      throw new NotFoundException(`User with ID ${userID} not found`);
    }
    const store = await this.storesService.findOne(scopedStoreID);
    if (!store) {
      throw new NotFoundException(`Store with ID ${scopedStoreID} not found`);
    }
    // Verificar si la relación ya existe
    const existingRelation = await this.userStoreRepo.findOne({
      where: {
        user: { userID: user.userID },
        store: { storeID: scopedStoreID },
      },
    });

    if (existingRelation) {
      throw new ConflictException('User is already associated with this store');
    }

    const userStore = this.userStoreRepo.create({
      user,
      store,
      role: dto.role ?? user.role ?? UserRole.STORE_MANAGER,
    });

    return this.userStoreRepo.save(userStore);
  }

  async findAll(activeStoreID?: string): Promise<UserStore[]> {
    return this.userStoreRepo.find({
      ...(activeStoreID
        ? { where: { store: { storeID: activeStoreID } } }
        : {}),
      relations: ['user', 'store'],
    });
  }

  async findStoresByUserId(
    userId: string,
    activeStoreID?: string,
  ): Promise<UserStore[]> {
    return this.userStoreRepo.find({
      where: {
        user: { userID: userId },
        ...(activeStoreID ? { store: { storeID: activeStoreID } } : {}),
      },
      relations: ['store'],
    });
  }

  async findUsersByStoreId(storeId: string): Promise<UserStore[]> {
    return this.userStoreRepo.find({
      where: { store: { storeID: storeId } },
      relations: ['user'],
    });
  }

  async remove(id: string, activeStoreID?: string): Promise<void> {
    const userStore = await this.userStoreRepo.findOne({
      where: {
        userStoreID: id,
        ...(activeStoreID ? { store: { storeID: activeStoreID } } : {}),
      },
    });
    if (!userStore) {
      throw new NotFoundException(`UserStore with ID ${id} not found`);
    }
    await this.userStoreRepo.remove(userStore);
  }
}
