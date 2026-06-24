import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../users/entities/user.entity';

export class CreateUserstoreDto {
  @ApiProperty({
    description: 'ID del usuario a asignar a la tienda',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsUUID()
  userID!: string;

  @ApiProperty({
    description: 'ID de la tienda donde se asignará el usuario',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  @IsUUID()
  storeID!: string;

  @ApiProperty({
    description: 'Rol del usuario dentro de esta tienda',
    enum: UserRole,
    example: UserRole.STORE_MANAGER,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
