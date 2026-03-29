import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Slot, SlotDocument } from '../slots/schemas/slot.schema';
import { VendorDocument } from '../vendors/schemas/vendor.schema';

export interface AnalyticsSummary {
  totalSlots: number;
  bookedSlots: number;
  recoveredSlots: number;
  recoveredRevenue: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(Slot.name)
    private readonly slotModel: Model<SlotDocument>,
  ) {}

  async getSummary(vendor: VendorDocument): Promise<AnalyticsSummary> {
    const vendorId = vendor._id;

    const [totalSlots, bookedSlots, recoveredAgg] = await Promise.all([
      this.slotModel.countDocuments({ vendorId }).exec(),
      this.slotModel.countDocuments({ vendorId, status: 'booked' }).exec(),
      this.slotModel
        .aggregate<{ count: number; revenue: number }>([
          {
            $match: {
              vendorId,
              status: 'booked',
              discountApplied: { $gt: 0 },
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              revenue: { $sum: '$finalPrice' },
            },
          },
        ])
        .exec(),
    ]);

    const recoveredSlots = recoveredAgg[0]?.count ?? 0;
    const recoveredRevenue = recoveredAgg[0]?.revenue ?? 0;

    this.logger.debug(
      `Analytics for vendor ${String(vendorId)}: total=${totalSlots} booked=${bookedSlots} recovered=${recoveredSlots}`,
    );

    return {
      totalSlots,
      bookedSlots,
      recoveredSlots,
      recoveredRevenue,
    };
  }
}
