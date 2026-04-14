export type ImageType = 'photo' | 'painting';

export enum ImageCategory {
  Landscape = 'landscape',
  Portrait = 'portrait',
  Street = 'street',
  Nature = 'nature',
  Architecture = 'architecture',
  Abstract = 'abstract',
  BlackAndWhite = 'black_and_white',
  Other = 'other',
}

export enum OrderStatus {
  Pending = 'pending',
  Paid = 'paid',
  Completed = 'completed',
  Expired = 'expired',
}

export enum OrderItemType {
  Original = 'original',
  Print = 'print',
  PhysicalOriginal = 'physical_original',
}

export interface ImagePrintOption {
  id: number;
  imageId: number;
  sku: string;
  description: string;
  price: number;
  widthCm: number;
  heightCm: number;
  fulfillmentProvider: string | null;
  printLimit: number | null;
  soldCount: number;
}

export interface WallBackground {
  id: number;
  name: string;
  imagePath: string;
  thumbnailPath: string;
  wallWidthCm: number | null;
  wallHeightCm: number | null;
  anchorX: number;
  anchorY: number;
  imageWidth: number;
  imageHeight: number;
  isDefault: boolean;
  sortOrder: number;
}

export interface FramePreset {
  id: number;
  name: string;
  borderColor: string;
  borderWidthMm: number;
  matColor: string;
  matWidthMm: number;
  shadowEnabled: boolean;
  enabled: boolean;
  sortOrder: number;
}

// Keep for backward compat — no longer used as column enum
export enum PaymentMethod {
  BTCPay = 'btcpay',
  PayPal = 'paypal',
}

export type ServiceType = 'payment' | 'fulfillment';

export interface ServiceConfig {
  provider: string;
  type: ServiceType;
  displayName: string;
  enabled: boolean;
  configured: boolean;
  configHint?: string;
  skus: FulfillmentSku[];
  sandbox: boolean;
}

export interface EnabledPayment {
  provider: string;
  displayName: string;
}

export interface FulfillmentSku {
  provider: string;
  sku: string;
  description: string;
  price?: string;
  widthCm?: number;
  heightCm?: number;
}

export type UserRole = 'admin' | 'artist';

export interface ShipFromAddress {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

export interface GalleryConfig {
  galleryName: string;
  subtitle: string;
  siteUrl: string;
  aboutText: string;
  shipFromAddress?: ShipFromAddress;
}

export interface ShippingRate {
  rateId: string;
  carrier: string;
  service: string;
  rate: number;
  currency: string;
  deliveryDays: number | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  imageCount?: number;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  artistId: number;
  sortOrder: number;
  imageCount?: number;
  createdAt: Date;
}

export interface ProtectedGallery {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  imageCount?: number;
  createdAt: Date;
}

export interface ProtectedGalleryPublic {
  name: string;
  slug: string;
  images: GalleryImage[];
}

export interface ContactInquiry {
  id: number;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  imageCount?: number;
}

export interface MediaType {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  imageCount?: number;
}

export interface PaintType {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  imageCount?: number;
}

export interface Artist {
  id: number;
  name: string;
  slug: string;
  bio: string | null;
  avatarUrl: string | null;
  portraitPath: string | null;
  instagramUrl: string | null;
  loginEnabled?: boolean;
  isActive?: boolean;
  createdAt: Date;
}

export interface GalleryImage {
  id: number;
  title: string;
  description: string | null;
  price: number;
  artist: Artist;
  filePath: string;
  thumbnailPath: string;
  watermarkPath: string;
  width: number;
  height: number;
  category: string;
  type: ImageType;
  projectId: number | null;
  project?: Project;
  isFeatured: boolean;
  sortOrder: number;
  blurHash: string | null;
  printEnabled: boolean;
  printLimit: number | null;
  printsSold: number;
  perOptionLimits: boolean;
  shotDate?: string | null;
  place?: string | null;
  originalFileName?: string | null;
  sizeWidthCm?: number | null;
  sizeHeightCm?: number | null;
  allowDownloadOriginal: boolean;
  originalAvailable: boolean;
  weightGrams: number | null;
  isArchived: boolean;
  printOptions: ImagePrintOption[];
  tags?: Tag[];
  mediaTypes?: MediaType[];
  paintTypes?: PaintType[];
  adminNote?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResponse {
  accessToken: string;
  role: 'admin' | 'artist';
  artistId?: number;
  mustChangePassword?: boolean;
}

export interface Order {
  id: number;
  customerEmail: string;
  status: OrderStatus;
  total: number;
  paymentMethod: string | null;
  paymentId: string | null;
  accessToken?: string;
  items?: OrderItem[];
  shippingName: string | null;
  shippingAddress1: string | null;
  shippingAddress2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
  shippingCost: number | null;
  shippingCarrier: string | null;
  shippingService: string | null;
  createdAt: Date;
}

export interface OrderItem {
  id: number;
  orderId: number;
  imageId: number;
  image?: GalleryImage;
  price: number;
  type: OrderItemType;
  printSku: string | null;
  fulfillmentOrderId: string | null;
  fulfillmentProvider: string | null;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface CreateOrderDto {
  customerEmail: string;
  items: { imageId: number; type: OrderItemType; printSku?: string }[];
  shippingAddress?: ShippingAddress;
  shippingRateId?: string;
  shippingCost?: number;
  shippingCarrier?: string;
  shippingService?: string;
}

export interface ShippingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CartItem {
  imageId: number;
  title: string;
  price: number;
  thumbnailPath: string;
  type: OrderItemType;
  printSku: string | null;
  printDescription: string | null;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
