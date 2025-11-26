import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { StoreStockService } from './store-stock.service';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { UpdateStorePriceDto } from './dto/update-store-price.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Stock de Tiendas')
@Controller('store-stock')
export class StoreStockController {
  constructor(private readonly storeStockService: StoreStockService) {}

  @Post('transfer')
  @ApiOperation({
    summary: 'Transferir stock de la central a una tienda',
    description: 'Realiza una transferencia gratuita de productos desde el stock central hacia una tienda específica. Útil para movimientos internos sin transacción comercial.',
  })
  @ApiResponse({ status: 201, description: 'Transferencia realizada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Stock insuficiente o datos inválidos.' })
  @ApiResponse({ status: 404, description: 'Tienda o Producto no encontrado.' })
  transferStock(@Body() transferStockDto: TransferStockDto) {
    return this.storeStockService.transferStock(transferStockDto);
  }

  @Get('inventory')
  @ApiOperation({
    summary: 'Consultar inventario de una tienda',
    description: 'Obtiene el listado completo de productos en stock de una tienda específica, incluyendo cantidades, costos de compra y precios de venta.',
  })
  @ApiResponse({ status: 200, description: 'Inventario de la tienda.' })
  getStoreInventory(@Query('storeID', ParseUUIDPipe) storeID: string) {
    return this.storeStockService.getStoreInventory(storeID);
  }

  @Patch(':storeProductID/price')
  @ApiOperation({
    summary: 'Actualizar precio de venta de un producto en tienda',
    description: 'Permite a una tienda establecer su propio precio de venta al público para un producto específico de su inventario.',
  })
  @ApiResponse({ status: 200, description: 'Precio actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Producto de tienda no encontrado.' })
  updateSalePrice(
    @Param('storeProductID', ParseUUIDPipe) storeProductID: string,
    @Body() updateStorePriceDto: UpdateStorePriceDto,
  ) {
    return this.storeStockService.updateSalePrice(
      storeProductID,
      updateStorePriceDto.salePrice,
    );
  }
}
