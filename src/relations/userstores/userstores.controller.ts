import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Headers,
} from '@nestjs/common';
import { UserstoresService } from './userstores.service';
import { CreateUserstoreDto } from './dto/create-userstore.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UserStore } from './entities/userstore.entity';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import {
  getOptionalScopedStoreID,
  getRequiredActiveStoreID,
} from '../../common/tenant/store-scope.util';

@ApiTags('Usuarios de las Tiendas')
@Controller('userstores')
export class UserstoresController {
  constructor(private readonly userstoresService: UserstoresService) {}

  @Post()
  @ApiOperation({
    summary: 'Asignar un usuario a una tienda',
    description:
      'Crea una relación entre un usuario y una tienda, permitiendo que el usuario tenga acceso a esa tienda.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario asignado a la tienda exitosamente.',
    type: UserStore,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  create(
    @Body() createUserstoreDto: CreateUserstoreDto,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const storeID = getRequiredActiveStoreID(user, activeStoreID);
    createUserstoreDto.storeID = storeID;
    return this.userstoresService.create(createUserstoreDto, storeID);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las relaciones usuario-tienda',
    description:
      'Retorna el listado completo de asignaciones entre usuarios y tiendas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de relaciones usuario-tienda.',
    type: [UserStore],
  })
  findAll(
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const scopedStoreID = getOptionalScopedStoreID(user, activeStoreID);
    return this.userstoresService.findAll(scopedStoreID);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener tiendas de un usuario',
    description: 'Retorna todas las tiendas a las que un usuario tiene acceso.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la relación usuario-tienda',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tiendas del usuario.',
    type: [UserStore],
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  findOne(
    @Param('id') id: string,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const scopedStoreID = getOptionalScopedStoreID(user, activeStoreID);
    return this.userstoresService.findStoresByUserId(id, scopedStoreID);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar asignación usuario-tienda',
    description:
      'Elimina la relación entre un usuario y una tienda, revocando el acceso del usuario a esa tienda.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la relación usuario-tienda',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Asignación eliminada exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Asignación no encontrada.' })
  remove(
    @Param('id') id: string,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const scopedStoreID = getOptionalScopedStoreID(user, activeStoreID);
    return this.userstoresService.remove(id, scopedStoreID);
  }
}
