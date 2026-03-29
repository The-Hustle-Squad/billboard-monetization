import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { VendorDocument } from '../../vendors/schemas/vendor.schema';

export const GetVendor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): VendorDocument => {
    const request = ctx.switchToHttp().getRequest<{ vendor: VendorDocument }>();
    return request.vendor;
  },
);
