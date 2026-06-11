import { UserRole } from '../../users/entities/user.entity';
import { UserStoreRole } from '../../relations/userstores/entities/userstore.entity';
import { Permission } from './permission.enum';

export const ALL_PERMISSIONS = Object.values(Permission);

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  [UserRole.ADMIN]: ALL_PERMISSIONS,
  [UserStoreRole.OWNER]: ALL_PERMISSIONS,
  [UserStoreRole.STORE_MANAGER]: [
    Permission.STORES_VIEW,
    Permission.STORE_USERS_VIEW,
    Permission.PRODUCTS_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_MANAGE,
    Permission.SALES_VIEW,
    Permission.SALES_CREATE,
    Permission.SALES_MANAGE,
    Permission.EXPENSES_VIEW,
    Permission.REPORTS_VIEW,
  ],
  [UserStoreRole.CONSIGNADO]: [
    Permission.STORES_VIEW,
    Permission.PRODUCTS_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.SALES_VIEW,
    Permission.SALES_CREATE,
    Permission.REPORTS_VIEW,
  ],
  [UserStoreRole.TERCERO]: [
    Permission.STORES_VIEW,
    Permission.PRODUCTS_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.SALES_VIEW,
    Permission.SALES_CREATE,
  ],
};
