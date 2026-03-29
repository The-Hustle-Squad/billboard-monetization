import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { VendorService } from '../../vendors/vendor.service';
import { VendorDocument } from '../../vendors/schemas/vendor.schema';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

interface AuthenticatedRequest extends Request {
  vendor: VendorDocument;
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly vendorService: VendorService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('x-api-key header is required');
    }

    const vendor = await this.vendorService.findByApiKey(apiKey);
    if (!vendor) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.vendor = vendor;
    return true;
  }
}
