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

export enum PaymentMethod {
  BTCPay = 'btcpay',
  PayPal = 'paypal',
}

export interface Photographer {
  id: number;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface GalleryImage {
  id: number;
  title: string;
  description: string | null;
  price: number;
  photographerId: number;
  photographer?: Photographer;
  filePath: string;
  thumbnailPath: string;
  watermarkPath: string;
  width: number;
  height: number;
  category: ImageCategory;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface Order {
  id: number;
  customerEmail: string;
  status: OrderStatus;
  total: number;
  paymentMethod: PaymentMethod | null;
  paymentId: string | null;
  items?: OrderItem[];
  createdAt: Date;
}

export interface OrderItem {
  id: number;
  orderId: number;
  imageId: number;
  image?: GalleryImage;
  price: number;
}

export interface AdminUser {
  id: number;
  username: string;
  passwordHash: string;
  createdAt: Date;
}

export interface CreateOrderDto {
  customerEmail: string;
  items: { imageId: number }[];
}

export interface CartItem {
  imageId: number;
  title: string;
  price: number;
  thumbnailPath: string;
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
