import { PartialType } from '@nestjs/swagger';
import { CreateUserstoreDto } from './create-userstore.dto';

export class UpdateUserstoreDto extends PartialType(CreateUserstoreDto) {}
