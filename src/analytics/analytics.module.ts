import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Slot, SlotSchema } from '../slots/schemas/slot.schema';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Slot.name, schema: SlotSchema }])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
