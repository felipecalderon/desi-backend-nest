import {
  Controller,
  Get,
  Headers,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { User } from '../users/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Store } from './entities/store.entity';
import { CustomMessage } from '../common/decorators/response-message';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import {
  getOptionalScopedStoreID,
  getUserScopedStoreID,
} from '../common/tenant/store-scope.util';

@ApiTags('Tiendas')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una nueva tienda',
    description:
      'Registra una nueva tienda en el sistema. Puede ser de tipo central, franquicia, consignación o terceros.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tienda creada exitosamente.',
    type: Store,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o email/nombre duplicado.',
  })
  @CustomMessage('Tienda creada exitosamente')
  create(@Body() createStoreDto: CreateStoreDto) {
    return this.storesService.create(createStoreDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las tiendas',
    description:
      'Retorna el listado completo de tiendas registradas en el sistema.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tiendas.',
    type: [Store],
  })
  findAll(
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const scopedStoreID = getOptionalScopedStoreID(user, activeStoreID);
    return this.storesService.findAll(scopedStoreID);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Obtener todos los usuarios de una tienda' })
  @ApiParam({
    name: 'id',
    description: 'ID de la tienda',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios de la tienda.',
    type: [User],
  })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada.' })
  findUsersByStoreId(
    @Param('id') id: string,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const scopedStoreID = getUserScopedStoreID(user, activeStoreID);
    return this.storesService.findUsersByStoreId(id, scopedStoreID);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una tienda por ID',
    description: 'Retorna la información detallada de una tienda específica.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la tienda',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Tienda encontrada.',
    type: Store,
  })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada.' })
  findOne(
    @Param('id') id: string,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const scopedStoreID = getUserScopedStoreID(user, activeStoreID);
    return this.storesService.findOne(id, scopedStoreID);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar información de una tienda',
    description:
      'Modifica los datos de una tienda existente (nombre, dirección, teléfono, etc.).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la tienda',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Tienda actualizada exitosamente.',
    type: Store,
  })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada.' })
  update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateStoreDto,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const scopedStoreID = getUserScopedStoreID(user, activeStoreID);
    return this.storesService.update(id, updateStoreDto, scopedStoreID);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar una tienda',
    description: 'Elimina permanentemente una tienda del sistema.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la tienda',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Tienda eliminada exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada.' })
  remove(
    @Param('id') id: string,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const scopedStoreID = getUserScopedStoreID(user, activeStoreID);
    return this.storesService.remove(id, scopedStoreID);
  }
}
