import { IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStorePriceDto {
  @ApiProperty({
    description: 'Nuevo precio de venta al público para este producto en la tienda',
    example: 25000,
    minimum: 0,
  })
  @IsNumber()
  @IsPositive()
  salePrice: number;
}
