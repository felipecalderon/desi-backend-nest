import { SetMetadata } from '@nestjs/common';

export type StoreScopeResource =
  | 'sale'
  | 'expense'
  | 'storeProduct'
  | 'userStore';

export interface StoreScopeOptions {
  required?: boolean;
  resource?: StoreScopeResource;
  param?: string;
}

export const STORE_SCOPE_KEY = 'storeScope';
export const StoreScoped = (options: StoreScopeOptions = {}) =>
  SetMetadata(STORE_SCOPE_KEY, {
    required: true,
    ...options,
  } satisfies StoreScopeOptions);
