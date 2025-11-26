import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'Vestuario',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'ID de la categoría padre (para crear subcategorías)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  parentID?: string;
}
