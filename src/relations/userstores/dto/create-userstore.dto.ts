import { IsString, IsUUID } from 'class-validator';

export class CreateUserstoreDto {
  @IsString()
  @IsUUID()
  userID: string;

  @IsString()
  @IsUUID()
  storeID: string;
}
