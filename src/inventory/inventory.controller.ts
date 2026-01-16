import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('movements')
  @ApiOperation({ summary: 'Create a manual inventory movement' })
  createMovement(
    @Body() createInventoryMovementDto: CreateInventoryMovementDto,
  ) {
    return this.inventoryService.createMovement(createInventoryMovementDto);
  }

  @Get('store/:storeID')
  @ApiOperation({ summary: 'Get stock for a specific store' })
  getStoreStock(@Param('storeID') storeID: string) {
    return this.inventoryService.getStoreStock(storeID);
  }
}
