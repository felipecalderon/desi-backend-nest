import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import {
  STORE_SCOPE_KEY,
  StoreScopeOptions,
} from '../decorators/store-scope.decorator';
import { Permission } from '../permissions/permission.enum';
import { ROLE_PERMISSIONS } from '../permissions/role-permissions';
import { UserRole } from '../../users/entities/user.entity';
import { UserStore } from '../../relations/userstores/entities/userstore.entity';
import { Sale } from '../../sales/entities/sale.entity';
import { Expense } from '../../expenses/entities/expense.entity';
import { StoreProduct } from '../../relations/storeproduct/entities/storeproduct.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const storeScope = this.reflector.getAllAndOverride<StoreScopeOptions>(
      STORE_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length && !storeScope) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const storeID = await this.resolveStoreID(request, storeScope);

    if (storeScope?.required && !storeID) {
      throw new BadRequestException('storeID is required for this operation');
    }

    const role = storeID
      ? await this.resolveContextualRole(user.id, storeID)
      : user.role;

    if (!role) {
      throw new ForbiddenException('User does not belong to this store');
    }

    if (!requiredPermissions?.length) {
      return true;
    }

    const allowedPermissions = ROLE_PERMISSIONS[role] ?? [];
    const hasPermissions = requiredPermissions.every((permission) =>
      allowedPermissions.includes(permission),
    );

    if (!hasPermissions) {
      throw new ForbiddenException(
        `User does not have the required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  private async resolveContextualRole(
    userID: string,
    storeID: string,
  ): Promise<string | null> {
    const membership = await this.dataSource.getRepository(UserStore).findOne({
      where: {
        user: { userID },
        store: { storeID },
      },
    });

    return membership?.role ?? null;
  }

  private async resolveStoreID(
    request: any,
    storeScope?: StoreScopeOptions,
  ): Promise<string | undefined> {
    if (storeScope?.resource) {
      return this.resolveStoreIDFromResource(request, storeScope);
    }

    if (storeScope?.param) {
      return request.params?.[storeScope.param];
    }

    return (
      request.params?.storeID ??
      request.params?.storeId ??
      request.query?.storeID ??
      request.query?.storeId ??
      request.body?.storeID ??
      request.body?.storeId ??
      request.body?.targetStoreID
    );
  }

  private async resolveStoreIDFromResource(
    request: any,
    storeScope: StoreScopeOptions,
  ): Promise<string | undefined> {
    const id = request.params?.[storeScope.param ?? 'id'];

    if (!id) {
      return undefined;
    }

    if (storeScope.resource === 'sale') {
      const sale = await this.dataSource.getRepository(Sale).findOne({
        where: { saleID: id },
        relations: ['store'],
      });
      return sale?.store?.storeID;
    }

    if (storeScope.resource === 'expense') {
      const expense = await this.dataSource.getRepository(Expense).findOne({
        where: { id },
        relations: ['store'],
      });
      return expense?.store?.storeID;
    }

    if (storeScope.resource === 'storeProduct') {
      const storeProduct = await this.dataSource
        .getRepository(StoreProduct)
        .findOne({
          where: { storeProductID: id },
          relations: ['store'],
        });
      return storeProduct?.store?.storeID;
    }

    if (storeScope.resource === 'userStore') {
      const userStore = await this.dataSource.getRepository(UserStore).findOne({
        where: { userStoreID: id },
        relations: ['store'],
      });
      return userStore?.store?.storeID;
    }

    return undefined;
  }
}
