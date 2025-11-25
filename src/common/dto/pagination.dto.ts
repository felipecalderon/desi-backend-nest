import { IsOptional, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({ default: 10, description: 'Cantidad de elementos por página' })
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ default: 0, description: 'Cantidad de elementos a saltar' })
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}
