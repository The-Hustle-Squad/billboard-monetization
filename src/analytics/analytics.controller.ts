import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiOkResponse } from '@nestjs/swagger';
import { AnalyticsService, AnalyticsSummary } from './analytics.service';
import { GetVendor } from '../common/decorators/get-vendor.decorator';
import { VendorDocument } from '../vendors/schemas/vendor.schema';
import { AnalyticsSummaryResponseDto } from '../common/swagger/api-response.models';

@ApiTags('analytics')
@ApiSecurity('api-key')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aggregated slot and revenue metrics for the vendor' })
  @ApiOkResponse({ type: AnalyticsSummaryResponseDto })
  async getSummary(@GetVendor() vendor: VendorDocument): Promise<AnalyticsSummary> {
    return this.analyticsService.getSummary(vendor);
  }
}
