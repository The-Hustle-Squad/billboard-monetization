import { ApiProperty } from '@nestjs/swagger';

export class SyncSummaryResponseDto {
  @ApiProperty({ description: 'New slots inserted' })
  created: number;

  @ApiProperty({ description: 'Existing non-booked slots updated' })
  updated: number;

  @ApiProperty({ description: 'Skipped because slot was already booked' })
  skipped: number;
}

export class PricingResultResponseDto {
  @ApiProperty()
  originalPrice: number;

  @ApiProperty()
  finalPrice: number;

  @ApiProperty({ description: 'Discount percentage applied (0–100)' })
  discountPercent: number;

  @ApiProperty({ type: String, format: 'date-time', description: 'Price is valid until this instant' })
  validUntil: Date;
}

export class LockIdResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Use this id when confirming the booking' })
  lockId: string;
}

export class ConfirmSlotResponseDto {
  @ApiProperty()
  success: boolean;
}

export class VendorCreatedResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Save this key; it is only returned on create' })
  apiKey: string;

  @ApiProperty()
  vacancyThresholdHours: number;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  discountBuckets: { hoursBefore: number; discountPercent: number }[];

  @ApiProperty()
  maxDiscountPercent: number;

  @ApiProperty()
  minPrice: number;

  @ApiProperty()
  lockTtlMinutes: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class VendorRulesUpdatedResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  vacancyThresholdHours: number;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  discountBuckets: { hoursBefore: number; discountPercent: number }[];

  @ApiProperty()
  maxDiscountPercent: number;

  @ApiProperty()
  minPrice: number;

  @ApiProperty()
  lockTtlMinutes: number;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class AnalyticsSummaryResponseDto {
  @ApiProperty()
  totalSlots: number;

  @ApiProperty()
  bookedSlots: number;

  @ApiProperty({ description: 'Bookings where a discount was applied' })
  recoveredSlots: number;

  @ApiProperty({ description: 'Sum of finalPrice for discounted bookings' })
  recoveredRevenue: number;
}

export class SlotListItemResponseDto {
  @ApiProperty({ description: 'Mongo document id' })
  _id: string;

  @ApiProperty({ description: 'External slot id' })
  slotId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  startTime: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  endTime: Date;

  @ApiProperty()
  basePrice: number;

  @ApiProperty({ enum: ['available', 'locked', 'booked', 'expired'] })
  status: string;

  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  lockId: string | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  lockedUntil: Date | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  bookedAt: Date | null;

  @ApiProperty({ nullable: true, description: 'Discount percent at booking' })
  discountApplied: number | null;

  @ApiProperty({ nullable: true })
  finalPrice: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class PaginatedSlotsResponseDto {
  @ApiProperty({ type: [SlotListItemResponseDto] })
  items: SlotListItemResponseDto[];

  @ApiProperty({ description: 'Total slots for this vendor (all pages)' })
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty({ description: 'Ceiling of total / limit' })
  totalPages: number;
}
