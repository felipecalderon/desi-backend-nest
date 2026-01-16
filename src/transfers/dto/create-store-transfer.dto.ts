import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateStoreTransferDto {
  @IsUUID()
  @IsNotEmpty()
  originStoreID: string;

  @IsUUID()
  @IsNotEmpty()
  destinationStoreID: string;
}
