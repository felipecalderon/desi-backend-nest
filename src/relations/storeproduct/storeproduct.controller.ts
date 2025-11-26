import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { StoreProductService } from './storeproduct.service';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreProduct } from './entities/storeproduct.entity';

@ApiTags('Productos de la Tienda')
@Controller('storeproduct')
export class StoreProductController {
  constructor(private readonly storeProductService: StoreProductService) {}

  @Post('transfer')
  @ApiOperation({
    summary: 'Transferir stock de la central a una tienda',
    description: 'Realiza una transferencia gratuita de productos desde el stock central hacia una tienda específica. Útil para movimientos internos sin transacción comercial.',
  })
  @ApiResponse({ status: 201, description: 'Transferencia realizada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Stock insuficiente o datos inválidos.' })
  @ApiResponse({ status: 404, description: 'Tienda o Producto no encontrado.' })
  transferStock(@Body() transferStockDto: TransferStockDto) {
    return this.storeProductService.transferStock(transferStockDto);
  }

  @Get('inventory')
  @ApiOperation({
    summary: 'Consultar inventario de una tienda',
    description: 'Obtiene el listado completo de productos en stock de una tienda específica, incluyendo cantidades, costos de compra y precios de venta.',
  })
  @ApiResponse({ status: 200, description: 'Inventario de la tienda.' })
  getStoreInventory(@Query('storeID', ParseUUIDPipe) storeID: string) {
    return this.storeProductService.getStoreInventory(storeID);
  }

  @Patch('update')
  @ApiOperation({
    summary: 'Actualizar un producto en tienda',
    description: 'Permite a una tienda actualizar un producto específico de su inventario.',
  })
  @ApiResponse({ status: 200, description: 'Producto actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Producto de tienda no encontrado.' })
  updateStoreProduct(
    @Body() storeProduct: StoreProduct,
  ) {
    return this.storeProductService.updateStoreProduct(
      storeProduct,
    );
  }
}
