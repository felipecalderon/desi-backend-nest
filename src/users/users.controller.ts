import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Store } from '../stores/entities/store.entity';
import { CustomMessage } from '../common/decorators/response-message';
import { User } from './entities/user.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import {
  getOptionalScopedStoreID,
  getRequiredActiveStoreID,
  getUserScopedStoreID,
} from '../common/tenant/store-scope.util';
import { UserRole } from './entities/user.entity';

@ApiTags('Usuarios')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({
    status: 201,
    description: 'El usuario ha sido creado exitosamente.',
    type: User,
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  create(
    @Body() createUserDto: CreateUserDto,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    if (createUserDto.role !== UserRole.SUPER_ADMIN) {
      createUserDto.storeID = getRequiredActiveStoreID(user, activeStoreID);
    }

    return this.usersService.create(createUserDto);
  }

  @Get()
  @CustomMessage('Lista de usuarios obtenida exitosamente')
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todos los usuarios.',
    type: [User],
  })
  findAll(
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const scopedStoreID = getOptionalScopedStoreID(user, activeStoreID);
    return this.usersService.findAll(scopedStoreID);
  }

  @Get(':id/stores')
  @ApiOperation({ summary: 'Obtener todas las tiendas de un usuario' })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tiendas del usuario.',
    type: [Store],
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  findStoresByUserId(
    @Param('id') id: string,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const scopedStoreID = getUserScopedStoreID(user, activeStoreID);
    return this.usersService.findStoresByUserId(id, scopedStoreID);
  }

  @Get(':email')
  @CustomMessage('Usuario encontrado exitosamente')
  @ApiOperation({ summary: 'Buscar un usuario por su email' })
  @ApiParam({
    name: 'email',
    description: 'Email del usuario a buscar',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Usuario encontrado.', type: User })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  findOne(
    @Param('email') email: string,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const scopedStoreID = getUserScopedStoreID(user, activeStoreID);
    return this.usersService.findOneByEmail(email, scopedStoreID);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un usuario por su ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario a actualizar',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'El usuario ha sido actualizado exitosamente.',
    type: User,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const scopedStoreID = getUserScopedStoreID(user, activeStoreID);
    return this.usersService.update(id, updateUserDto, scopedStoreID);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un usuario por su ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario a eliminar',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'El usuario ha sido eliminado exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  remove(
    @Param('id') id: string,
    @Headers('x-store-id') activeStoreID: string | undefined,
    @GetUser() user: JwtPayload,
  ) {
    const scopedStoreID = getUserScopedStoreID(user, activeStoreID);
    return this.usersService.remove(id, scopedStoreID);
  }
}
