import * as bcrypt from 'bcrypt';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const user = this.userRepo.create({
      ...dto,
      password: hashedPassword,
    });

    return this.userRepo.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async findOneByEmail(email: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user)
      throw new NotFoundException(`User with email ${email} not found`);
    return user;
  }

  async findOneById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { userID: id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async findStoresByUserId(id: string): Promise<any> {
    const user = await this.userRepo.findOne({
      where: { userID: id },
      relations: ['userStores', 'userStores.store'],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user.userStores.map((userStore) => userStore.store);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOneById(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    if (dto.password) {
      const saltRounds = 10;
      dto.password = await bcrypt.hash(dto.password, saltRounds);
    }

    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOneById(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    await this.userRepo.remove(user);
  }
}
