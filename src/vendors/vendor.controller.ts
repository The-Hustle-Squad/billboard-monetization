import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateRulesDto } from './dto/update-rules.dto';
import { Public } from '../common/decorators/public.decorator';
import { GetVendor } from '../common/decorators/get-vendor.decorator';
import { VendorDocument } from './schemas/vendor.schema';

@Controller('vendors')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async createVendor(@Body() dto: CreateVendorDto): Promise<object> {
    const vendor = await this.vendorService.create(dto);
    return {
      _id: vendor._id,
      name: vendor.name,
      apiKey: vendor.apiKey,
      vacancyThresholdHours: vendor.vacancyThresholdHours,
      discountBuckets: vendor.discountBuckets,
      maxDiscountPercent: vendor.maxDiscountPercent,
      minPrice: vendor.minPrice,
      lockTtlMinutes: vendor.lockTtlMinutes,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
    };
  }

  @Post('rules')
  @HttpCode(HttpStatus.OK)
  async updateRules(
    @GetVendor() vendor: VendorDocument,
    @Body() dto: UpdateRulesDto,
  ): Promise<object> {
    const updated = await this.vendorService.updateRules(vendor, dto);
    return {
      _id: updated._id,
      name: updated.name,
      vacancyThresholdHours: updated.vacancyThresholdHours,
      discountBuckets: updated.discountBuckets,
      maxDiscountPercent: updated.maxDiscountPercent,
      minPrice: updated.minPrice,
      lockTtlMinutes: updated.lockTtlMinutes,
      updatedAt: updated.updatedAt,
    };
  }
}
