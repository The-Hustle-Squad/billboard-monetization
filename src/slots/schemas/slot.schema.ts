import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SlotStatus = 'available' | 'locked' | 'booked' | 'expired';

export type SlotDocument = HydratedDocument<Slot>;

@Schema({ timestamps: true })
export class Slot {
  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true, index: true })
  vendorId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  slotId: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true, min: 0 })
  basePrice: number;

  @Prop({
    required: true,
    enum: ['available', 'locked', 'booked', 'expired'],
    default: 'available',
  })
  status: SlotStatus;

  @Prop({ default: null, type: String })
  lockId: string | null;

  @Prop({ default: null, type: Date })
  lockedUntil: Date | null;

  @Prop({ default: null, type: Date })
  bookedAt: Date | null;

  @Prop({ default: null, type: Number })
  discountApplied: number | null;

  @Prop({ default: null, type: Number })
  finalPrice: number | null;

  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export const SlotSchema = SchemaFactory.createForClass(Slot);

SlotSchema.index({ vendorId: 1, slotId: 1 }, { unique: true });
SlotSchema.index({ vendorId: 1, status: 1 });
