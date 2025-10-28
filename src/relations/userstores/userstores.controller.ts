import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserstoresService } from './userstores.service';
import { CreateUserstoreDto } from './dto/create-userstore.dto';
import { UpdateUserstoreDto } from './dto/update-userstore.dto';

@Controller('userstores')
export class UserstoresController {
  constructor(private readonly userstoresService: UserstoresService) {}

  @Post()
  create(@Body() createUserstoreDto: CreateUserstoreDto) {
    return this.userstoresService.create(createUserstoreDto);
  }

  @Get()
  findAll() {
    return this.userstoresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userstoresService.findStoresByUserId(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userstoresService.remove(id);
  }
}
