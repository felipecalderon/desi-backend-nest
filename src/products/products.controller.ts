import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Product } from './entities/product.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { getRequiredActiveStoreID } from '../common/tenant/store-scope.util';

@ApiTags('Productos')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo producto con sus variantes' })
  @ApiResponse({
    status: 201,
    description: 'El producto ha sido creado exitosamente.',
    type: Product,
  })
  create(
    @Body() createProductDto: CreateProductDto,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.productsService.create(createProductDto, storeID);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los productos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos.',
    type: [Product],
  })
  findAll(
    @Query() paginationDto: PaginationDto,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.productsService.findAll(paginationDto, storeID);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar un producto por su ID' })
  @ApiParam({
    name: 'id',
    description: 'ID único del producto',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado.',
    type: Product,
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.productsService.findOne(id, storeID);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un producto por su ID' })
  @ApiParam({
    name: 'id',
    description: 'ID de producto a actualizar',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado exitosamente.',
    type: Product,
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.productsService.update(id, updateProductDto, storeID);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un producto por su ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del producto a eliminar',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'Producto eliminado exitosamente.',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const storeID = getRequiredActiveStoreID(user, activeStoreID);
    return this.productsService.remove(id, storeID);
  }
}
