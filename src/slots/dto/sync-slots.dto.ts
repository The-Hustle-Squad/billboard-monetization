import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsISO8601,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SyncSlotItemDto {
  @IsString()
  @IsNotEmpty()
  slotId: string;

  @IsISO8601({ strict: true })
  startTime: string;

  @IsISO8601({ strict: true })
  endTime: string;

  @IsNumber()
  @Min(0)
  basePrice: number;
}

export class SyncSlotsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SyncSlotItemDto)
  slots: SyncSlotItemDto[];
}
