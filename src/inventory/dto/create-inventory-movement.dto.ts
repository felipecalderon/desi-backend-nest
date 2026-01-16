import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { InventoryMovementReason } from '../entities/inventory-movement.entity';

export class CreateInventoryMovementDto {
  @IsUUID()
  @IsNotEmpty()
  storeID: string;

  @IsUUID()
  @IsNotEmpty()
  variationID: string;

  /**
   * The quantity involved in the movement.
   * Required for SALE, PURCHASE, TRANSFER_IN, TRANSFER_OUT.
   * Should be a positive integer.
   */
  @IsInt()
  @IsOptional()
  quantity?: number;

  /**
   * The final stock value (for ADJUSTMENT).
   * Required if reason is ADJUSTMENT.
   */
  @IsInt()
  @IsOptional()
  newStock?: number;

  @IsEnum(InventoryMovementReason)
  @IsNotEmpty()
  reason: InventoryMovementReason;

  @IsString()
  @IsOptional()
  referenceID?: string;
}
