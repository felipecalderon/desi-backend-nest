import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';
import { CreateStoreDto } from './create-store.dto';

export class UpdateStoreDto extends PartialType(CreateStoreDto) {
  @ApiPropertyOptional({
    description: 'URL de la imagen de la tienda',
    example: 'https://ejemplo.com/nueva_imagen.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  readonly storeImg?: string;
}
