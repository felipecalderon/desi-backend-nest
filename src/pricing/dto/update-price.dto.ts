import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PriceType } from '../entities/price-history.entity';

export class UpdatePriceDto {
  @IsUUID()
  @IsNotEmpty()
  storeID: string;

  @IsUUID()
  @IsNotEmpty()
  variationID: string;

  @IsEnum(PriceType)
  @IsNotEmpty()
  priceType: PriceType;

  @IsNumber()
  @IsNotEmpty()
  newPrice: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  changedBy?: string;
}
