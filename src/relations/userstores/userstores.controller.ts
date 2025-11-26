import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserstoresService } from './userstores.service';
import { CreateUserstoreDto } from './dto/create-userstore.dto';
import { UpdateUserstoreDto } from './dto/update-userstore.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Usuarios de las Tiendas')
@Controller('userstores')
export class UserstoresController {
  constructor(private readonly userstoresService: UserstoresService) {}

  @Post()
  @ApiOperation({
    summary: 'Asignar un usuario a una tienda',
    description: 'Crea una relación entre un usuario y una tienda, permitiendo que el usuario tenga acceso a esa tienda.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario asignado a la tienda exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  create(@Body() createUserstoreDto: CreateUserstoreDto) {
    return this.userstoresService.create(createUserstoreDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las relaciones usuario-tienda',
    description: 'Retorna el listado completo de asignaciones entre usuarios y tiendas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de relaciones usuario-tienda.',
  })
  findAll() {
    return this.userstoresService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener tiendas de un usuario',
    description: 'Retorna todas las tiendas a las que un usuario tiene acceso.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tiendas del usuario.',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.userstoresService.findStoresByUserId(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar asignación usuario-tienda',
    description: 'Elimina la relación entre un usuario y una tienda, revocando el acceso del usuario a esa tienda.',
  })
  @ApiResponse({
    status: 200,
    description: 'Asignación eliminada exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Asignación no encontrada.' })
  remove(@Param('id') id: string) {
    return this.userstoresService.remove(id);
  }
}
