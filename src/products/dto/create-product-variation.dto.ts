import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateProductVariationDto {
  @ApiProperty({
    description: 'Nombre de la variante (ej: "Rojo, Talla L")',
    example: 'Rojo, Talla L',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'SKU único para la variante',
    example: 'CAM-ROJ-L-001',
  })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ description: 'Precio de la variante', example: 29.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Stock disponible de la variante', example: 100 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({
    description: 'Color de la variante',
    example: 'Rojo',
    required: false,
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({
    description: 'Talla de la variante',
    example: 'L',
    required: false,
  })
  @IsString()
  @IsOptional()
  size?: string;
}
