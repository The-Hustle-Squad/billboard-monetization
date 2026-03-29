import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SlotService, SyncSummary } from './slot.service';
import { SyncSlotsDto } from './dto/sync-slots.dto';
import { ConfirmSlotDto } from './dto/confirm-slot.dto';
import { GetVendor } from '../common/decorators/get-vendor.decorator';
import { VendorDocument } from '../vendors/schemas/vendor.schema';
import { PricingResult } from '../pricing/pricing.service';

@Controller('slots')
export class SlotController {
  constructor(private readonly slotService: SlotService) {}

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncSlots(
    @GetVendor() vendor: VendorDocument,
    @Body() dto: SyncSlotsDto,
  ): Promise<SyncSummary> {
    return this.slotService.syncSlots(vendor, dto.slots);
  }

  @Get(':slotId/pricing')
  async getPricing(
    @GetVendor() vendor: VendorDocument,
    @Param('slotId') slotId: string,
  ): Promise<PricingResult> {
    return this.slotService.getPricing(vendor, slotId);
  }

  @Post(':slotId/lock')
  @HttpCode(HttpStatus.OK)
  async lockSlot(
    @GetVendor() vendor: VendorDocument,
    @Param('slotId') slotId: string,
  ): Promise<{ lockId: string }> {
    return this.slotService.lockSlot(vendor, slotId);
  }

  @Post(':slotId/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmSlot(
    @GetVendor() vendor: VendorDocument,
    @Param('slotId') slotId: string,
    @Body() dto: ConfirmSlotDto,
  ): Promise<{ success: boolean }> {
    return this.slotService.confirmSlot(vendor, slotId, dto);
  }
}
