import { Injectable, BadRequestException } from '@nestjs/common';
import { EasyPostProvider } from '../services/providers/easypost/easypost.provider';
import { GalleryConfigService } from '../gallery-config/gallery-config.service';
import { ImagesService } from '../images/images.service';
import type { ShippingRate, ShippingAddress } from '@gallery/shared';

/** Packaging buffer added to artwork dimensions (cm) */
const PACKAGING_BUFFER_CM = 5;
/** Default parcel depth for flat artwork (inches) */
const DEFAULT_DEPTH_IN = 4;
/** How long cached rates remain valid (15 minutes) */
const RATE_CACHE_TTL_MS = 15 * 60 * 1000;

interface CachedRate {
  rate: ShippingRate;
  expiresAt: number;
}

@Injectable()
export class ShippingService {
  private readonly rateCache = new Map<string, CachedRate>();

  constructor(
    private readonly easyPost: EasyPostProvider,
    private readonly galleryConfig: GalleryConfigService,
    private readonly imagesService: ImagesService,
  ) {}

  /**
   * Look up a previously-fetched rate by its EasyPost rateId.
   * Returns null if the rate is not cached or has expired.
   */
  getVerifiedRate(rateId: string): ShippingRate | null {
    const cached = this.rateCache.get(rateId);
    if (!cached || cached.expiresAt < Date.now()) {
      this.rateCache.delete(rateId);
      return null;
    }
    return cached.rate;
  }

  async getRates(imageIds: number[], toAddress: ShippingAddress): Promise<ShippingRate[]> {
    if (!this.easyPost.configured) {
      throw new BadRequestException('Shipping provider is not configured');
    }

    const config = await this.galleryConfig.get();
    if (!config.shipFromAddress) {
      throw new BadRequestException('Ship-from address is not configured');
    }

    const uniqueImageIds = [...new Set(imageIds)];

    let maxWidthCm = 0;
    let maxHeightCm = 0;
    let totalWeightGrams = 0;

    for (const imageId of uniqueImageIds) {
      const image = await this.imagesService.findOne(imageId);
      const w = Number(image.sizeWidthCm) || 30;
      const h = Number(image.sizeHeightCm) || 30;
      maxWidthCm = Math.max(maxWidthCm, w);
      maxHeightCm = Math.max(maxHeightCm, h);
      totalWeightGrams += image.weightGrams ?? this.imagesService.estimateWeightGrams(w, h);
    }

    // Add packaging buffer and convert cm to inches (1 inch = 2.54 cm)
    const lengthIn = (maxHeightCm + PACKAGING_BUFFER_CM) / 2.54;
    const widthIn = (maxWidthCm + PACKAGING_BUFFER_CM) / 2.54;
    // Convert grams to ounces (1 oz = 28.3495 g), add packaging weight (~200g)
    const weightOz = (totalWeightGrams + 200) / 28.3495;

    const from = config.shipFromAddress;

    const rates = await this.easyPost.getRates(
      from,
      {
        name: toAddress.name,
        street1: toAddress.address1,
        street2: toAddress.address2,
        city: toAddress.city,
        state: toAddress.state,
        zip: toAddress.postalCode,
        country: toAddress.country,
      },
      {
        lengthIn: Math.round(lengthIn * 10) / 10,
        widthIn: Math.round(widthIn * 10) / 10,
        heightIn: DEFAULT_DEPTH_IN,
        weightOz: Math.round(weightOz * 10) / 10,
      },
    );

    // Cache rates for server-side verification at order creation
    const expiresAt = Date.now() + RATE_CACHE_TTL_MS;
    for (const rate of rates) {
      this.rateCache.set(rate.rateId, { rate, expiresAt });
    }

    // Periodic cleanup of expired entries
    if (this.rateCache.size > 1000) {
      const now = Date.now();
      for (const [key, entry] of this.rateCache) {
        if (entry.expiresAt < now) this.rateCache.delete(key);
      }
    }

    return rates;
  }
}
