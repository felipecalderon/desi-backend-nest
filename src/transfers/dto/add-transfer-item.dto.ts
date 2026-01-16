import { IsInt, IsNotEmpty, IsPositive, IsUUID } from 'class-validator';

export class AddTransferItemDto {
  @IsUUID()
  @IsNotEmpty()
  variationID: string;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  quantity: number;
}
