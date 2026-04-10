import type { GalleryImage } from '@gallery/shared';

export type GalleryStackParams = {
  Gallery: undefined;
  ImageDetail: { imageId: number; image?: GalleryImage };
};

export type ArtistsStackParams = {
  Artists: undefined;
  ArtistDetail: { artistId: number; artistName: string };
  ArtistImageDetail: { imageId: number; image?: GalleryImage };
};

export type CartStackParams = {
  Cart: undefined;
};

export type ProfileStackParams = {
  Profile: undefined;
  OrderDetail: { orderId: number; accessToken?: string };
};

export type RootStackParams = {
  MainTabs: undefined;
  Login: undefined;
  OrderDetail: { orderId: number; accessToken?: string };
};
