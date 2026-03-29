import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class ConfirmSlotDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('4')
  lockId: string;
}
