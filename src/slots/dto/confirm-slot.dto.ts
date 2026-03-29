import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmSlotDto {
  @ApiProperty({ format: 'uuid', description: 'Lock id returned from POST .../lock' })
  @IsString()
  @IsNotEmpty()
  @IsUUID('4')
  lockId: string;
}
