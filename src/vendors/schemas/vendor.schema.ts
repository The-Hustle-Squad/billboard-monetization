import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VendorDocument = HydratedDocument<Vendor>;

@Schema({ _id: false })
export class DiscountBucket {
  @Prop({ required: true, min: 1 })
  hoursBefore: number;

  @Prop({ required: true, min: 0, max: 100 })
  discountPercent: number;
}

export const DiscountBucketSchema = SchemaFactory.createForClass(DiscountBucket);

@Schema({ timestamps: true })
export class Vendor {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  apiKey: string;

  @Prop({ required: true, min: 1, default: 72 })
  vacancyThresholdHours: number;

  @Prop({ type: [DiscountBucketSchema], default: [] })
  discountBuckets: DiscountBucket[];

  @Prop({ required: true, min: 0, max: 100, default: 100 })
  maxDiscountPercent: number;

  @Prop({ required: true, min: 0, default: 0 })
  minPrice: number;

  @Prop({ required: true, min: 1, default: 15 })
  lockTtlMinutes: number;

  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);
