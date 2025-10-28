import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { User } from 'src/users/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CustomMessage } from 'src/common/decorators/response-message';

@ApiTags('Tiendas')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @CustomMessage('Tienda creada exitosamente')
  create(@Body() createStoreDto: CreateStoreDto) {
    return this.storesService.create(createStoreDto);
  }

  @Get()
  findAll() {
    return this.storesService.findAll();
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
  findUsersByStoreId(@Param('id') id: string) {
    return this.storesService.findUsersByStoreId(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storesService.update(id, updateStoreDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.storesService.remove(id);
  }
}
