import { UserRole } from '../../users/entities/user.entity';

export interface JwtStoreMembership {
  storeID: string;
  name: string;
  role: UserRole;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  stores?: JwtStoreMembership[];
}
