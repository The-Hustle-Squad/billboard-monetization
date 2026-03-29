import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { VendorModule } from './vendors/vendor.module';
import { SlotModule } from './slots/slot.module';
import { PricingModule } from './pricing/pricing.module';
import { LockModule } from './locks/lock.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ApiKeyGuard } from './common/guards/api-key.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    HealthModule,
    MongooseModule.forRoot(
      process.env.MONGO_URI as string,
    ),
    AuthModule,
    VendorModule,
    SlotModule,
    PricingModule,
    LockModule,
    AnalyticsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}
