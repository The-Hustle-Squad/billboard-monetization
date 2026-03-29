import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Slot, SlotDocument } from './schemas/slot.schema';
import { VendorDocument } from '../vendors/schemas/vendor.schema';
import { PricingService, PricingResult } from '../pricing/pricing.service';
import { LockService } from '../locks/lock.service';
import { SyncSlotItemDto } from './dto/sync-slots.dto';
import { ConfirmSlotDto } from './dto/confirm-slot.dto';

export interface SyncSummary {
  created: number;
  updated: number;
  skipped: number;
}

@Injectable()
export class SlotService {
  private readonly logger = new Logger(SlotService.name);

  constructor(
    @InjectModel(Slot.name)
    private readonly slotModel: Model<SlotDocument>,
    private readonly pricingService: PricingService,
    private readonly lockService: LockService,
  ) {}

  async syncSlots(vendor: VendorDocument, items: SyncSlotItemDto[]): Promise<SyncSummary> {
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of items) {
      const startTime = new Date(item.startTime);
      const endTime = new Date(item.endTime);

      if (endTime <= startTime) {
        throw new BadRequestException(
          `Slot ${item.slotId}: endTime must be after startTime`,
        );
      }

      const existing = await this.slotModel
        .findOne({ vendorId: vendor._id, slotId: item.slotId })
        .exec();

      if (!existing) {
        await this.slotModel.create({
          vendorId: vendor._id,
          slotId: item.slotId,
          startTime,
          endTime,
          basePrice: item.basePrice,
          status: 'available',
          lockId: null,
          lockedUntil: null,
          bookedAt: null,
          discountApplied: null,
          finalPrice: null,
        });
        created++;
      } else if (existing.status === 'booked') {
        skipped++;
      } else {
        await this.slotModel
          .updateOne(
            { vendorId: vendor._id, slotId: item.slotId },
            { $set: { startTime, endTime, basePrice: item.basePrice } },
          )
          .exec();
        updated++;
      }
    }

    this.logger.log(
      `Sync for vendor ${String(vendor._id)}: created=${created} updated=${updated} skipped=${skipped}`,
    );
    return { created, updated, skipped };
  }

  async getPricing(vendor: VendorDocument, slotId: string): Promise<PricingResult> {
    const slot = await this.findSlot(vendor, slotId);
    const now = new Date();
    const outcome = this.pricingService.compute(slot, vendor, now);

    if (!outcome.available) {
      switch (outcome.reason) {
        case 'booked':
          throw new ConflictException('Slot is already booked');
        case 'locked':
          throw new ConflictException('Slot is currently locked');
        case 'expired':
          throw new BadRequestException('Slot has expired');
      }
    }

    return outcome.pricing;
  }

  async lockSlot(
    vendor: VendorDocument,
    slotId: string,
  ): Promise<{ lockId: string }> {
    const slot = await this.findSlot(vendor, slotId);
    const now = new Date();

    if (slot.status === 'booked') {
      throw new ConflictException('Slot is already booked');
    }

    if (slot.endTime <= now) {
      throw new BadRequestException('Slot has expired');
    }

    if (
      slot.status === 'locked' &&
      slot.lockedUntil !== null &&
      slot.lockedUntil > now
    ) {
      throw new ConflictException('Slot is currently locked by another party');
    }

    const lockId = uuidv4();
    const ttlSeconds = vendor.lockTtlMinutes * 60;
    const lockKey = this.lockService.buildKey(String(vendor._id), slotId);

    const acquired = await this.lockService.acquireLock(lockKey, lockId, ttlSeconds);
    if (!acquired) {
      throw new ConflictException('Failed to acquire lock — slot is already locked');
    }

    const lockedUntil = new Date(now.getTime() + ttlSeconds * 1000);

    await this.slotModel
      .updateOne(
        { vendorId: vendor._id, slotId },
        { $set: { status: 'locked', lockId, lockedUntil } },
      )
      .exec();

    this.logger.log(`Slot locked: vendor=${String(vendor._id)} slotId=${slotId} lockId=${lockId}`);
    return { lockId };
  }

  async confirmSlot(
    vendor: VendorDocument,
    slotId: string,
    dto: ConfirmSlotDto,
  ): Promise<{ success: boolean }> {
    const slot = await this.findSlot(vendor, slotId);

    if (slot.status === 'booked') {
      if (slot.lockId === dto.lockId) {
        return { success: true };
      }
      throw new ConflictException('Slot is already booked with a different lock');
    }

    if (slot.status !== 'locked') {
      throw new BadRequestException('Slot is not in a locked state');
    }

    if (slot.lockId !== dto.lockId) {
      throw new BadRequestException('Invalid lockId');
    }

    const now = new Date();
    const outcome = this.pricingService.compute(slot, vendor, now);
    const discountApplied = outcome.available ? outcome.pricing.discountPercent : 0;
    const confirmedFinalPrice = outcome.available ? outcome.pricing.finalPrice : slot.basePrice;

    const lockKey = this.lockService.buildKey(String(vendor._id), slotId);

    await this.slotModel
      .updateOne(
        { vendorId: vendor._id, slotId },
        {
          $set: {
            status: 'booked',
            bookedAt: now,
            discountApplied,
            finalPrice: confirmedFinalPrice,
          },
        },
      )
      .exec();

    await this.lockService.releaseLock(lockKey);

    this.logger.log(
      `Slot confirmed: vendor=${String(vendor._id)} slotId=${slotId} discount=${discountApplied}%`,
    );

    return { success: true };
  }

  private async findSlot(vendor: VendorDocument, slotId: string): Promise<SlotDocument> {
    const slot = await this.slotModel
      .findOne({ vendorId: vendor._id, slotId })
      .exec();

    if (!slot) {
      throw new NotFoundException(`Slot '${slotId}' not found`);
    }

    return slot;
  }
}
