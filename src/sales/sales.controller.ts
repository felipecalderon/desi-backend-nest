import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleStatusDto } from './dto/update-sale-status.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { Sale } from './entities/sale.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';
import { StoreScoped } from '../auth/decorators/store-scope.decorator';

@ApiTags('Ventas')
@Roles(
  UserRole.ADMIN,
  UserRole.STORE_MANAGER,
  UserRole.CONSIGNADO,
  UserRole.TERCERO,
)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @RequirePermissions(Permission.SALES_CREATE)
  @StoreScoped()
  @ApiOperation({
    summary: 'Registrar una venta',
    description:
      'Registra una nueva venta para una tienda específica. Si la tienda es Central, se descuenta del stock global de variaciones. Si es una tienda asociada (franquicia, etc.), se descuenta del stock local de la tienda (StoreProduct).',
  })
  @ApiResponse({
    status: 201,
    description: 'Venta creada exitosamente.',
    type: Sale,
  })
  @ApiResponse({
    status: 400,
    description: 'Stock insuficiente o datos inválidos.',
  })
  @ApiResponse({ status: 404, description: 'Tienda o Producto no encontrado.' })
  create(@Body() createSaleDto: CreateSaleDto) {
    return this.salesService.create(createSaleDto);
  }

  @Get()
  @RequirePermissions(Permission.SALES_VIEW)
  @StoreScoped()
  @ApiOperation({
    summary: 'Obtener todas las ventas registradas',
    description:
      'Retorna un listado de todas las ventas realizadas, ordenadas por fecha de creación (más recientes primero).',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de ventas.',
    type: [Sale],
  })
  findAll(@Query('storeID') storeID: string) {
    return this.salesService.findAll(storeID);
  }

  @Get(':id')
  @RequirePermissions(Permission.SALES_VIEW)
  @StoreScoped({ resource: 'sale' })
  @ApiOperation({
    summary: 'Obtener detalle de una venta específica',
    description:
      'Retorna la información completa de una venta incluyendo productos, cantidades, precios y estado.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la venta',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Venta encontrada.',
    type: Sale,
  })
  @ApiResponse({ status: 404, description: 'Venta no encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.findOne(id);
  }

  @Patch(':id/status')
  @RequirePermissions(Permission.SALES_MANAGE)
  @StoreScoped({ resource: 'sale' })
  @ApiOperation({
    summary: 'Actualizar el estado de una venta',
    description:
      'Permite cambiar el estado de una venta entre Pendiente, Pagado o Anulado.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la venta',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado exitosamente.',
    type: Sale,
  })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSaleStatusDto: UpdateSaleStatusDto,
  ) {
    return this.salesService.updateStatus(id, updateSaleStatusDto);
  }
}
