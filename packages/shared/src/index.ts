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
}

export interface ImagePrintOption {
  id: number;
  imageId: number;
  sku: string;
  description: string;
  price: number;
  fulfillmentProvider: string | null;
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
}

export type UserRole = 'admin' | 'artist';

export interface GalleryConfig {
  galleryName: string;
  subtitle: string;
  siteUrl: string;
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

export interface Tag {
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
  projectId: number | null;
  project?: Project;
  isFeatured: boolean;
  sortOrder: number;
  printEnabled: boolean;
  printLimit: number | null;
  printsSold: number;
  allowDownloadOriginal: boolean;
  isArchived: boolean;
  printOptions: ImagePrintOption[];
  tags?: Tag[];
  createdAt: Date;
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
