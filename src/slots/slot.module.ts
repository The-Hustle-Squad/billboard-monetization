import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Slot, SlotSchema } from './schemas/slot.schema';
import { SlotService } from './slot.service';
import { SlotController } from './slot.controller';
import { PricingModule } from '../pricing/pricing.module';
import { LockModule } from '../locks/lock.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Slot.name, schema: SlotSchema }]),
    PricingModule,
    LockModule,
  ],
  controllers: [SlotController],
  providers: [SlotService],
  exports: [SlotService],
})
export class SlotModule {}
