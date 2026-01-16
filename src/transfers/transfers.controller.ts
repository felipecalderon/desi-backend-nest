import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { CreateStoreTransferDto } from './dto/create-store-transfer.dto';
import { AddTransferItemDto } from './dto/add-transfer-item.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Transfers')
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new draft transfer' })
  createTransfer(@Body() createDto: CreateStoreTransferDto) {
    return this.transfersService.createTransfer(createDto);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add an item to a pending transfer' })
  addItem(
    @Param('id') transferID: string,
    @Body() addItemDto: AddTransferItemDto,
  ) {
    return this.transfersService.addItem(transferID, addItemDto);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a transfer and move stock' })
  completeTransfer(@Param('id') transferID: string) {
    return this.transfersService.completeTransfer(transferID);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transfer details' })
  getTransfer(@Param('id') transferID: string) {
    return this.transfersService.getTransfer(transferID);
  }
}
