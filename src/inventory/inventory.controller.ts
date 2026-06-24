import { Controller, Post, Body, Get, Param, Headers } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { getRequiredActiveStoreID } from '../common/tenant/store-scope.util';

@ApiTags('Inventario')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('movements')
  @ApiOperation({
    summary: 'Crear un movimiento de inventario manual',
    description:
      'Registra una entrada o salida manual de stock para un producto específico en una tienda.',
  })
  @ApiResponse({
    status: 201,
    description: 'El movimiento de inventario ha sido registrado exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o stock insuficiente.',
  })
  createMovement(
    @Body() createInventoryMovementDto: CreateInventoryMovementDto,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    createInventoryMovementDto.storeID = getRequiredActiveStoreID(
      user,
      activeStoreID,
    );
    return this.inventoryService.createMovement(createInventoryMovementDto);
  }

  @Get('store/:storeID')
  @ApiOperation({
    summary: 'Obtener el stock de una tienda específica',
    description:
      'Devuelve la lista de productos y sus cantidades actuales para la tienda solicitada.',
  })
  @ApiParam({ name: 'storeID', description: 'ID de la tienda (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de inventario recuperada exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada.' })
  getStoreStock(
    @Param('storeID') storeID: string,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const scopedStoreID = getRequiredActiveStoreID(user, activeStoreID);
    return this.inventoryService.getStoreStock(scopedStoreID);
  }
}
