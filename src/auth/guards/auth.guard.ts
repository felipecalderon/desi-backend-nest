import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../users/entities/user.entity';
import { JwtStoreMembership } from '../interfaces/jwt-payload.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
      this.validateStoreScope(request, payload);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private validateStoreScope(request: any, user: any): void {
    if (user.role === UserRole.SUPER_ADMIN) {
      request['activeStoreID'] = request.headers['x-store-id'];
      return;
    }

    const activeStoreID = request.headers['x-store-id'];
    if (!activeStoreID) {
      return;
    }

    const belongsToActiveStore = user.stores?.some(
      (store: JwtStoreMembership) => store.storeID === activeStoreID,
    );

    if (!belongsToActiveStore) {
      throw new ForbiddenException('User does not belong to the active store');
    }

    const requestedStoreID = this.findRequestedStoreID(request);
    if (requestedStoreID && requestedStoreID !== activeStoreID) {
      throw new ForbiddenException(
        'Requested store does not match the active store',
      );
    }

    request['activeStoreID'] = activeStoreID;
  }

  private findRequestedStoreID(request: any): string | undefined {
    return (
      request.params?.storeID ??
      request.params?.storeId ??
      request.query?.storeID ??
      request.query?.storeId ??
      request.body?.storeID ??
      request.body?.storeId
    );
  }
}
