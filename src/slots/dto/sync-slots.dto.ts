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
import { ApiProperty } from '@nestjs/swagger';

export class SyncSlotItemDto {
  @ApiProperty({ example: 'slot-abc-123' })
  @IsString()
  @IsNotEmpty()
  slotId: string;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-04-01T10:00:00.000Z' })
  @IsISO8601({ strict: true })
  startTime: string;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-04-01T11:00:00.000Z' })
  @IsISO8601({ strict: true })
  endTime: string;

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  @Min(0)
  basePrice: number;
}

export class SyncSlotsDto {
  @ApiProperty({ type: [SyncSlotItemDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SyncSlotItemDto)
  slots: SyncSlotItemDto[];
}
