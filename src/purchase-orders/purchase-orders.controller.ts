import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { UpdatePurchaseOrderStatusDto } from './dto/update-purchase-order-status.dto';
import { VerifyPurchaseOrderDto } from './dto/verify-purchase-order.dto';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { getRequiredActiveStoreID } from '../common/tenant/store-scope.util';

@ApiTags('Ordenes de Compra')
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una orden de compra' })
  @ApiResponse({
    status: 201,
    description: 'Orden de compra creada.',
    type: PurchaseOrder,
  })
  create(
    @Body() dto: CreatePurchaseOrderDto,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    dto.storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.purchaseOrdersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar órdenes de compra' })
  @ApiResponse({
    status: 200,
    description: 'Lista de órdenes de compra.',
    type: [PurchaseOrder],
  })
  findAll(
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.purchaseOrdersService.findAll(storeID);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una orden de compra' })
  @ApiParam({
    name: 'id',
    description: 'ID de la orden de compra',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la orden de compra.',
    type: PurchaseOrder,
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.purchaseOrdersService.findOne(id, storeID);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos generales de la orden de compra' })
  @ApiParam({
    name: 'id',
    description: 'ID de la orden de compra',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Orden de compra actualizada.',
    type: PurchaseOrder,
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseOrderDto,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const storeID = getRequiredActiveStoreID(user, activeStoreID);
    dto.storeID = storeID;
    return this.purchaseOrdersService.update(id, dto, storeID);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar el estado/pago de la orden de compra' })
  @ApiParam({
    name: 'id',
    description: 'ID de la orden de compra',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de orden de compra actualizado.',
    type: PurchaseOrder,
  })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseOrderStatusDto,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.purchaseOrdersService.updateStatus(id, dto, storeID);
  }

  @Post(':id/verify')
  @ApiOperation({
    summary: 'Verificar productos recibidos para la orden de compra',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la orden de compra',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Verificación procesada exitosamente.',
  })
  verify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyPurchaseOrderDto,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.purchaseOrdersService.verify(id, dto, storeID);
  }
}
