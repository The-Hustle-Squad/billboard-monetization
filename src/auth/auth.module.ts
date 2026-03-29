import { Module } from '@nestjs/common';
import { VendorModule } from '../vendors/vendor.module';

@Module({
  imports: [VendorModule],
})
export class AuthModule {}
