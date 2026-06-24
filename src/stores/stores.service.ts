import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UserStore } from '../relations/userstores/entities/userstore.entity';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
  ) {}

  async create(dto: CreateStoreDto): Promise<Store> {
    const store = this.storeRepo.create(dto);
    return this.storeRepo.save(store);
  }

  async findAll(storeID?: string): Promise<Store[]> {
    return this.storeRepo.find({
      ...(storeID ? { where: { storeID } } : {}),
    });
  }

  async findOne(id: string, activeStoreID?: string): Promise<Store> {
    if (activeStoreID && activeStoreID !== id) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }

    const store = await this.storeRepo.findOne({
      where: { storeID: id },
    });
    if (!store) throw new NotFoundException(`Store with ID ${id} not found`);
    return store;
  }

  async findUsersByStoreId(id: string, activeStoreID?: string): Promise<any> {
    if (activeStoreID && activeStoreID !== id) {
      throw new NotFoundException(`Tienda con ID ${id} no encontrada`);
    }

    const store = await this.storeRepo.findOne({
      where: { storeID: id },
      relations: ['userStores', 'userStores.user'],
    });

    if (!store) {
      throw new NotFoundException(`Tienda con ID ${id} no encontrada`);
    }

    return store.userStores.map((userStore: UserStore) => ({
      ...userStore.user,
      role: userStore.role,
    }));
  }

  async update(
    id: string,
    dto: UpdateStoreDto,
    activeStoreID?: string,
  ): Promise<Store> {
    const store = await this.findOne(id, activeStoreID);
    Object.assign(store, dto);
    return this.storeRepo.save(store);
  }

  async remove(id: string, activeStoreID?: string): Promise<void> {
    const store = await this.findOne(id, activeStoreID);
    await this.storeRepo.remove(store);
  }
}
