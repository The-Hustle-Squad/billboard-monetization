import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AnalyticsService, AnalyticsSummary } from './analytics.service';
import { GetVendor } from '../common/decorators/get-vendor.decorator';
import { VendorDocument } from '../vendors/schemas/vendor.schema';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @HttpCode(HttpStatus.OK)
  async getSummary(@GetVendor() vendor: VendorDocument): Promise<AnalyticsSummary> {
    return this.analyticsService.getSummary(vendor);
  }
}
