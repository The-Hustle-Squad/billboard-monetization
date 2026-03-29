import {
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountBucketDto } from './create-vendor.dto';

export class UpdateRulesDto {
  @ApiPropertyOptional({ example: 48 })
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

  @ApiPropertyOptional({ example: 50 })
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

  @ApiPropertyOptional({ example: 15 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  lockTtlMinutes?: number;
}
