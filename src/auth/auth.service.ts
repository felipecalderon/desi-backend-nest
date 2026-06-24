import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      const user = await this.usersService.findOneByEmail(email);

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload: JwtPayload = {
        id: user.userID,
        email: user.email,
        role: user.role,
        stores: this.mapStoreMemberships(user),
      };

      return {
        user: {
          id: user.userID,
          email: user.email,
          name: user.name,
          role: user.role,
          userImg: user.userImg,
          stores: this.mapStoreMemberships(user),
        },
        accessToken: await this.jwtService.signAsync(payload),
      };
    } catch (error) {
      this.logger.error(`Login failed for email ${email}: ${error.message}`);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async checkAuthStatus(userId: string) {
    const user = await this.usersService.findOneById(userId);

    const payload: JwtPayload = {
      id: user.userID,
      email: user.email,
      role: user.role,
      stores: this.mapStoreMemberships(user),
    };

    return {
      user: {
        id: user.userID,
        email: user.email,
        name: user.name,
        role: user.role,
        userImg: user.userImg,
        stores: this.mapStoreMemberships(user),
      },
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  private mapStoreMemberships(user: User) {
    return (
      user.userStores?.map((userStore) => ({
        storeID: userStore.store.storeID,
        name: userStore.store.name,
        role: userStore.role,
      })) ?? []
    );
  }
}
