import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private getGlobalRole(role: string): 'ROLE_ADMIN' | 'ROLE_USER' {
    return role === 'admin' ? 'ROLE_ADMIN' : 'ROLE_USER';
  }

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
        roles: this.getGlobalRole(user.role),
      };

      return {
        user: {
          id: user.userID,
          email: user.email,
          name: user.name,
          role: user.role,
          roles: this.getGlobalRole(user.role),
          userImg: user.userImg,
        },
        accessToken: await this.jwtService.signAsync(payload),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Login failed for email ${email}: ${errorMessage}`);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async checkAuthStatus(userId: string) {
    const user = await this.usersService.findOneById(userId);

    const payload: JwtPayload = {
      id: user.userID,
      email: user.email,
      role: user.role,
      roles: this.getGlobalRole(user.role),
    };

    return {
      user: {
        id: user.userID,
        email: user.email,
        name: user.name,
        role: user.role,
        roles: this.getGlobalRole(user.role),
        userImg: user.userImg,
      },
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
