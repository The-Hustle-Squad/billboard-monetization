import { Injectable } from '@nestjs/common';
import { VendorDocument } from '../vendors/schemas/vendor.schema';
import { SlotDocument } from '../slots/schemas/slot.schema';

export interface PricingResult {
  originalPrice: number;
  finalPrice: number;
  discountPercent: number;
  validUntil: Date;
}

export type PricingOutcome =
  | { available: false; reason: 'booked' | 'locked' | 'expired' }
  | { available: true; pricing: PricingResult };

@Injectable()
export class PricingService {
  compute(slot: SlotDocument, vendor: VendorDocument, now: Date = new Date()): PricingOutcome {
    if (slot.status === 'booked') {
      return { available: false, reason: 'booked' };
    }

    if (slot.endTime <= now) {
      return { available: false, reason: 'expired' };
    }

    if (slot.status === 'locked' && slot.lockedUntil !== null && slot.lockedUntil > now) {
      return { available: false, reason: 'locked' };
    }

    const msRemaining = slot.startTime.getTime() - now.getTime();
    const hoursRemaining = msRemaining / (1000 * 60 * 60);

    if (hoursRemaining > vendor.vacancyThresholdHours) {
      const validUntil = new Date(
        slot.startTime.getTime() - vendor.vacancyThresholdHours * 60 * 60 * 1000,
      );
      return {
        available: true,
        pricing: {
          originalPrice: slot.basePrice,
          finalPrice: slot.basePrice,
          discountPercent: 0,
          validUntil,
        },
      };
    }

    const sortedBuckets = [...vendor.discountBuckets].sort(
      (a, b) => a.hoursBefore - b.hoursBefore,
    );

    const bucketIndex = sortedBuckets.findIndex((b) => hoursRemaining <= b.hoursBefore);

    let discountPercent = 0;
    let validUntil: Date;

    if (bucketIndex === -1) {
      discountPercent = 0;
      if (sortedBuckets.length > 0) {
        validUntil = new Date(
          slot.startTime.getTime() -
            sortedBuckets[sortedBuckets.length - 1].hoursBefore * 60 * 60 * 1000,
        );
      } else {
        validUntil = slot.startTime;
      }
    } else {
      const bucket = sortedBuckets[bucketIndex];
      discountPercent = Math.min(bucket.discountPercent, vendor.maxDiscountPercent);

      if (bucketIndex === 0) {
        validUntil = slot.startTime;
      } else {
        validUntil = new Date(
          slot.startTime.getTime() -
            sortedBuckets[bucketIndex - 1].hoursBefore * 60 * 60 * 1000,
        );
      }
    }

    const originalPrice = slot.basePrice;
    const finalPrice = Math.max(
      Math.round(originalPrice * (100 - discountPercent)) / 100,
      vendor.minPrice,
    );

    return {
      available: true,
      pricing: {
        originalPrice,
        finalPrice,
        discountPercent,
        validUntil,
      },
    };
  }
}
