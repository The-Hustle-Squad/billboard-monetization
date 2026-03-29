import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiSecurity,
  ApiParam,
  ApiOkResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { SlotService, SyncSummary, PaginatedSlotsResult } from './slot.service';
import { SyncSlotsDto } from './dto/sync-slots.dto';
import { ConfirmSlotDto } from './dto/confirm-slot.dto';
import { ListSlotsQueryDto } from './dto/list-slots-query.dto';
import { GetVendor } from '../common/decorators/get-vendor.decorator';
import { VendorDocument } from '../vendors/schemas/vendor.schema';
import { PricingResult } from '../pricing/pricing.service';
import {
  SyncSummaryResponseDto,
  PricingResultResponseDto,
  LockIdResponseDto,
  ConfirmSlotResponseDto,
  PaginatedSlotsResponseDto,
} from '../common/swagger/api-response.models';

@ApiTags('slots')
@ApiSecurity('api-key')
@Controller('slots')
export class SlotController {
  constructor(private readonly slotService: SlotService) {}

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upsert inventory slots for the authenticated vendor' })
  @ApiOkResponse({ type: SyncSummaryResponseDto })
  async syncSlots(
    @GetVendor() vendor: VendorDocument,
    @Body() dto: SyncSlotsDto,
  ): Promise<SyncSummary> {
    return this.slotService.syncSlots(vendor, dto.slots);
  }

  @Get()
  @ApiOperation({
    summary: 'List all slots for the authenticated vendor',
    description: 'Offset pagination by `page` and `limit`. Ordered by `startTime` descending (newest window first).',
  })
  @ApiOkResponse({ type: PaginatedSlotsResponseDto })
  async listSlots(
    @GetVendor() vendor: VendorDocument,
    @Query() query: ListSlotsQueryDto,
  ): Promise<PaginatedSlotsResult> {
    return this.slotService.listSlots(vendor, query.page ?? 1, query.limit ?? 20);
  }

  @Get(':slotId/pricing')
  @ApiOperation({ summary: 'Get current discounted price for a slot' })
  @ApiParam({ name: 'slotId', description: 'External slot identifier' })
  @ApiOkResponse({ type: PricingResultResponseDto })
  @ApiNotFoundResponse({ description: 'Slot not found' })
  @ApiBadRequestResponse({ description: 'Slot has expired' })
  @ApiConflictResponse({ description: 'Slot booked or locked' })
  async getPricing(
    @GetVendor() vendor: VendorDocument,
    @Param('slotId') slotId: string,
  ): Promise<PricingResult> {
    return this.slotService.getPricing(vendor, slotId);
  }

  @Post(':slotId/lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acquire a short-lived lock before confirming a booking' })
  @ApiParam({ name: 'slotId', description: 'External slot identifier' })
  @ApiOkResponse({ type: LockIdResponseDto })
  @ApiNotFoundResponse({ description: 'Slot not found' })
  @ApiBadRequestResponse({ description: 'Slot has expired' })
  @ApiConflictResponse({ description: 'Slot booked, locked, or lock could not be acquired' })
  async lockSlot(
    @GetVendor() vendor: VendorDocument,
    @Param('slotId') slotId: string,
  ): Promise<{ lockId: string }> {
    return this.slotService.lockSlot(vendor, slotId);
  }

  @Post(':slotId/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm booking using the lock id from the lock step' })
  @ApiParam({ name: 'slotId', description: 'External slot identifier' })
  @ApiOkResponse({ type: ConfirmSlotResponseDto })
  @ApiNotFoundResponse({ description: 'Slot not found' })
  @ApiBadRequestResponse({ description: 'Invalid state or lock id' })
  @ApiConflictResponse({ description: 'Already booked with a different lock' })
  async confirmSlot(
    @GetVendor() vendor: VendorDocument,
    @Param('slotId') slotId: string,
    @Body() dto: ConfirmSlotDto,
  ): Promise<{ success: boolean }> {
    return this.slotService.confirmSlot(vendor, slotId, dto);
  }
}
