import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreMonthlyTargetsService } from './store-monthly-targets.service';
import { CreateStoreMonthlyTargetDto } from './dto/create-store-monthly-target.dto';
import { UpdateStoreMonthlyTargetDto } from './dto/update-store-monthly-target.dto';
import { StoreMonthlyTarget } from './entities/store-monthly-target.entity';

@ApiTags('Metas Mensuales de Tienda')
@Controller('store-monthly-targets')
export class StoreMonthlyTargetsController {
  constructor(
    private readonly storeMonthlyTargetsService: StoreMonthlyTargetsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una meta mensual para una tienda' })
  @ApiResponse({
    status: 201,
    description: 'Meta mensual creada exitosamente.',
    type: StoreMonthlyTarget,
  })
  create(@Body() createDto: CreateStoreMonthlyTargetDto) {
    return this.storeMonthlyTargetsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las metas mensuales' })
  @ApiResponse({
    status: 200,
    description: 'Lista de metas mensuales.',
    type: [StoreMonthlyTarget],
  })
  findAll() {
    return this.storeMonthlyTargetsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una meta mensual por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID de la meta mensual',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Meta mensual encontrada.',
    type: StoreMonthlyTarget,
  })
  @ApiResponse({
    status: 404,
    description: 'Meta mensual no encontrada.',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeMonthlyTargetsService.findOne(id);
  }

  @Get('store/:storeID/current')
  @ApiOperation({
    summary: 'Obtener la meta mensual actual de una tienda por ID',
  })
  @ApiParam({ name: 'storeID', description: 'ID de la tienda', type: String })
  @ApiResponse({
    status: 200,
    description: 'Meta mensual actual (0 si no existe).',
  })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada.' })
  getCurrent(@Param('storeID', ParseUUIDPipe) storeID: string) {
    return this.storeMonthlyTargetsService.getCurrentTargetByStore(storeID);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una meta mensual',
    description: 'Solo permite editar metas del mes actual o de meses futuros.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la meta mensual',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Meta mensual actualizada exitosamente.',
    type: StoreMonthlyTarget,
  })
  @ApiResponse({
    status: 400,
    description: 'La meta pertenece a un mes pasado o el payload es inválido.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateStoreMonthlyTargetDto,
  ) {
    return this.storeMonthlyTargetsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una meta mensual',
    description:
      'Solo permite eliminar metas del mes actual o de meses futuros.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la meta mensual',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'Meta mensual eliminada exitosamente.',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeMonthlyTargetsService.remove(id);
  }
}
