import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { JwtStoreMembership } from '../interfaces/jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const storeId = context.switchToHttp().getRequest().headers['x-store-id'];
    const activeStoreRole = user.stores?.find(
      (store: JwtStoreMembership) => store.storeID === storeId,
    )?.role;

    const hasRole = requiredRoles.some(
      (role) => user.role === role || activeStoreRole === role,
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `User does not have the required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
