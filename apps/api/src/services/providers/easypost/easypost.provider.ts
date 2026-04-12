import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import EasyPostClient from '@easypost/api';
import type { Rate } from '@easypost/api/types/Rate/Rate';
import { loadProviderEnv } from '../load-env';
import type { ShippingRate } from '@gallery/shared';

const env = loadProviderEnv(__dirname);

@Injectable()
export class EasyPostProvider {
  private readonly logger = new Logger(EasyPostProvider.name);
  private readonly apiKey: string;

  constructor() {
    this.apiKey = env.EASYPOST_API_KEY || process.env.EASYPOST_API_KEY || '';
  }

  get configured(): boolean {
    return !!this.apiKey;
  }

  get configHint(): string {
    return 'Set EASYPOST_API_KEY in apps/api/src/services/providers/easypost/.env';
  }

  private getClient(): InstanceType<typeof EasyPostClient> {
    return new EasyPostClient(this.apiKey);
  }

  async getRates(
    fromAddress: {
      name: string;
      company?: string;
      street1: string;
      street2?: string;
      city: string;
      state: string;
      zip: string;
      country: string;
      phone?: string;
    },
    toAddress: {
      name: string;
      street1: string;
      street2?: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    },
    parcel: {
      lengthIn: number;
      widthIn: number;
      heightIn: number;
      weightOz: number;
    },
  ): Promise<ShippingRate[]> {
    const client = this.getClient();

    let shipment;
    try {
      shipment = await client.Shipment.create({
        from_address: {
          name: fromAddress.name,
          company: fromAddress.company,
          street1: fromAddress.street1,
          street2: fromAddress.street2,
          city: fromAddress.city,
          state: fromAddress.state,
          zip: fromAddress.zip,
          country: fromAddress.country,
          phone: fromAddress.phone,
        },
        to_address: {
          name: toAddress.name,
          street1: toAddress.street1,
          street2: toAddress.street2,
          city: toAddress.city,
          state: toAddress.state,
          zip: toAddress.zip,
          country: toAddress.country,
        },
        parcel: {
          length: parcel.lengthIn,
          width: parcel.widthIn,
          height: parcel.heightIn,
          weight: parcel.weightOz,
        },
      });
    } catch (error) {
      this.logger.error('EasyPost API error', error);
      throw new BadRequestException(
        'Unable to calculate shipping rates. Please verify your address and try again.',
      );
    }

    if (!shipment.rates || shipment.rates.length === 0) {
      this.logger.warn('No shipping rates returned from EasyPost');
      return [];
    }

    return (shipment.rates as Rate[])
      .map((rate: Rate) => ({
        rateId: rate.id,
        carrier: rate.carrier,
        service: rate.service,
        rate: parseFloat(rate.rate),
        currency: rate.currency,
        deliveryDays: rate.delivery_days ?? null,
      }))
      .sort((a: ShippingRate, b: ShippingRate) => a.rate - b.rate);
  }
}
