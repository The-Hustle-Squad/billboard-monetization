import {
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountBucketDto } from './create-vendor.dto';

export class UpdateRulesDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  vacancyThresholdHours?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiscountBucketDto)
  @IsOptional()
  discountBuckets?: DiscountBucketDto[];

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  maxDiscountPercent?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  lockTtlMinutes?: number;
}
