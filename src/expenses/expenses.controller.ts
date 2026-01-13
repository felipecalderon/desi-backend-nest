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
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { Expense } from './entities/expense.entity';
import { CustomMessage } from 'src/common/decorators/response-message';

@ApiTags('Gastos')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo gasto' })
  @ApiResponse({
    status: 201,
    description: 'El gasto ha sido creado exitosamente.',
    type: Expense,
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  create(@Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.create(createExpenseDto);
  }

  @Get()
  @CustomMessage('Lista de gastos obtenida exitosamente')
  @ApiOperation({ summary: 'Obtener todos los gastos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todos los gastos.',
    type: [Expense],
  })
  findAll() {
    return this.expensesService.findAll();
  }

  @Get(':id')
  @CustomMessage('Gasto encontrado exitosamente')
  @ApiOperation({ summary: 'Obtener un gasto por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del gasto',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Gasto encontrado.',
    type: Expense,
  })
  @ApiResponse({ status: 404, description: 'Gasto no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un gasto por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del gasto a actualizar',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'El gasto ha sido actualizado exitosamente.',
    type: Expense,
  })
  @ApiResponse({ status: 404, description: 'Gasto no encontrado.' })
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expensesService.update(id, updateExpenseDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un gasto por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del gasto a eliminar',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'El gasto ha sido eliminado exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Gasto no encontrado.' })
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}
