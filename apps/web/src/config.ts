export { useConfigStore as useConfig } from '@/store/config';

export const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL || 'http://localhost:4000/uploads';

export const FULFILLMENT_COUNTRY = 'US';
export const FULFILLMENT_CURRENCY = 'USD';
