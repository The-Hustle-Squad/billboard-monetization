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

export class DiscountBucketDto {
  @IsNumber()
  @Min(1)
  hoursBefore: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent: number;
}

export class CreateVendorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

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
