import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  Max,
  ValidateNested,
  ArrayUnique,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DiscountBucketDto {
  @ApiProperty({ example: 24, description: 'Apply this discount when at most this many hours remain before slot start' })
  @IsNumber()
  @Min(1)
  hoursBefore: number;

  @ApiProperty({ example: 10, description: 'Discount percent for this bucket' })
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent: number;
}

export class CreateVendorDto {
  @ApiProperty({ example: 'Acme Billboards' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 48, description: 'Hours before start below which discounts may apply' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  vacancyThresholdHours?: number;

  @ApiPropertyOptional({ type: [DiscountBucketDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiscountBucketDto)
  @IsOptional()
  discountBuckets?: DiscountBucketDto[];

  @ApiPropertyOptional({ example: 50, description: 'Cap on discount across buckets' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  maxDiscountPercent?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ example: 15, description: 'How long a lock stays valid (minutes)' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  lockTtlMinutes?: number;
}
