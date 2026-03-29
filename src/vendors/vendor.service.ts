import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Vendor, VendorDocument } from './schemas/vendor.schema';
import { CreateVendorDto, DiscountBucketDto } from './dto/create-vendor.dto';
import { UpdateRulesDto } from './dto/update-rules.dto';

@Injectable()
export class VendorService {
  private readonly logger = new Logger(VendorService.name);

  constructor(
    @InjectModel(Vendor.name)
    private readonly vendorModel: Model<VendorDocument>,
  ) {}

  async create(dto: CreateVendorDto): Promise<VendorDocument> {
    const effectiveMax = dto.maxDiscountPercent ?? 100;
    if (dto.discountBuckets?.length) {
      this.validateBuckets(dto.discountBuckets, effectiveMax);
    }

    const apiKey = uuidv4();
    const vendor = new this.vendorModel({
      name: dto.name,
      apiKey,
      vacancyThresholdHours: dto.vacancyThresholdHours ?? 72,
      discountBuckets: dto.discountBuckets ?? [],
      maxDiscountPercent: effectiveMax,
      minPrice: dto.minPrice ?? 0,
      lockTtlMinutes: dto.lockTtlMinutes ?? 15,
    });

    const saved = await vendor.save();
    this.logger.log(`Vendor created: ${saved._id}`);
    return saved;
  }

  async updateRules(vendor: VendorDocument, dto: UpdateRulesDto): Promise<VendorDocument> {
    const effectiveMax = dto.maxDiscountPercent ?? vendor.maxDiscountPercent;
    const bucketsToValidate = dto.discountBuckets ?? vendor.discountBuckets;

    if (bucketsToValidate.length > 0) {
      this.validateBuckets(bucketsToValidate, effectiveMax);
    }

    if (dto.vacancyThresholdHours !== undefined) {
      vendor.vacancyThresholdHours = dto.vacancyThresholdHours;
    }
    if (dto.discountBuckets !== undefined) {
      vendor.discountBuckets = dto.discountBuckets;
    }
    if (dto.maxDiscountPercent !== undefined) {
      vendor.maxDiscountPercent = dto.maxDiscountPercent;
    }
    if (dto.minPrice !== undefined) {
      vendor.minPrice = dto.minPrice;
    }
    if (dto.lockTtlMinutes !== undefined) {
      vendor.lockTtlMinutes = dto.lockTtlMinutes;
    }

    const updated = await vendor.save();
    this.logger.log(`Vendor rules updated: ${updated._id}`);
    return updated;
  }

  async findByApiKey(apiKey: string): Promise<VendorDocument | null> {
    return this.vendorModel.findOne({ apiKey }).exec();
  }

  async findById(id: string): Promise<VendorDocument> {
    const vendor = await this.vendorModel.findById(id).exec();
    if (!vendor) {
      throw new NotFoundException(`Vendor not found`);
    }
    return vendor;
  }

  private validateBuckets(buckets: DiscountBucketDto[], maxDiscountPercent: number): void {
    const hoursBefores = buckets.map((b) => b.hoursBefore);
    const unique = new Set(hoursBefores);
    if (unique.size !== hoursBefores.length) {
      throw new BadRequestException('Discount buckets must not contain duplicate hoursBefore values');
    }

    for (const bucket of buckets) {
      if (bucket.hoursBefore <= 0) {
        throw new BadRequestException('hoursBefore must be greater than 0');
      }
      if (bucket.discountPercent > maxDiscountPercent) {
        throw new BadRequestException(
          `Bucket discountPercent (${bucket.discountPercent}) exceeds maxDiscountPercent (${maxDiscountPercent})`,
        );
      }
    }
  }
}
