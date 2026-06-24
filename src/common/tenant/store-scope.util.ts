import { BadRequestException } from '@nestjs/common';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../../users/entities/user.entity';

export function getRequiredActiveStoreID(
  user: JwtPayload,
  activeStoreID?: string,
): string {
  if (!activeStoreID) {
    throw new BadRequestException('x-store-id header is required');
  }

  return activeStoreID;
}

export function getOptionalScopedStoreID(
  user: JwtPayload,
  activeStoreID?: string,
): string | undefined {
  if (user.role === UserRole.SUPER_ADMIN) {
    return activeStoreID;
  }

  return getRequiredActiveStoreID(user, activeStoreID);
}

export function getUserScopedStoreID(
  user: JwtPayload,
  activeStoreID?: string,
): string | undefined {
  if (user.role === UserRole.SUPER_ADMIN) {
    return undefined;
  }

  return getRequiredActiveStoreID(user, activeStoreID);
}
