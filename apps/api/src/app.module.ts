import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { ArtistsModule } from './artists/artists.module';
import { ImagesModule } from './images/images.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { AiModule } from './ai/ai.module';
import { ServicesModule } from './services/services.module';
import { GalleryConfigModule } from './gallery-config/gallery-config.module';
import { GalleryConfigEntity } from './gallery-config/gallery-config.entity';
import { CategoriesModule } from './categories/categories.module';
import { CategoryEntity } from './categories/category.entity';
import { ProjectsModule } from './projects/projects.module';
import { ProjectEntity } from './projects/project.entity';
import { ProtectedGalleriesModule } from './protected-galleries/protected-galleries.module';
import { ProtectedGalleryEntity } from './protected-galleries/protected-gallery.entity';
import { ProtectedGalleryImageEntity } from './protected-galleries/protected-gallery-image.entity';
import { ArtistEntity } from './artists/artist.entity';
import { ImageEntity } from './images/image.entity';
import { OrderEntity } from './orders/order.entity';
import { OrderItemEntity } from './orders/order-item.entity';
import { AdminUserEntity } from './auth/admin-user.entity';
import { ImagePrintOptionEntity } from './images/image-print-option.entity';
import { ServiceConfigEntity } from './services/service-config.entity';
import { TagsModule } from './tags/tags.module';
import { ContactsModule } from './contacts/contacts.module';
import { ChatModule } from './chat/chat.module';
import { WallsModule } from './walls/walls.module';
import { WallBackgroundEntity } from './walls/wall-background.entity';
import { FramePresetEntity } from './walls/frame-preset.entity';
import { ContactInquiryEntity } from './contacts/contact-inquiry.entity';
import { TagEntity } from './tags/tag.entity';
import { ImageTagEntity } from './tags/image-tag.entity';
import { MediaTypesModule } from './media-types/media-types.module';
import { MediaTypeEntity } from './media-types/media-type.entity';
import { ImageMediaTypeEntity } from './media-types/image-media-type.entity';
import { PaintTypesModule } from './paint-types/paint-types.module';
import { PaintTypeEntity } from './paint-types/paint-type.entity';
import { ImagePaintTypeEntity } from './paint-types/image-paint-type.entity';
import { ShippingModule } from './shipping/shipping.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST', 'localhost'),
        port: config.get<number>('DATABASE_PORT', 5432),
        database: config.get('DATABASE_NAME', 'gallery'),
        username: config.get('DATABASE_USER', 'gallery_user'),
        password: config.get('DATABASE_PASSWORD', ''),
        entities: [
          ArtistEntity,
          ImageEntity,
          ImagePrintOptionEntity,
          OrderEntity,
          OrderItemEntity,
          AdminUserEntity,
          ServiceConfigEntity,
          GalleryConfigEntity,
          CategoryEntity,
          ProjectEntity,
          ProtectedGalleryEntity,
          ProtectedGalleryImageEntity,
          TagEntity,
          ImageTagEntity,
          MediaTypeEntity,
          ImageMediaTypeEntity,
          PaintTypeEntity,
          ImagePaintTypeEntity,
          ContactInquiryEntity,
          WallBackgroundEntity,
          FramePresetEntity,
        ],
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    ArtistsModule,
    ImagesModule,
    OrdersModule,
    PaymentsModule,
    ServicesModule,
    AiModule,
    GalleryConfigModule,
    CategoriesModule,
    ProjectsModule,
    ProtectedGalleriesModule,
    TagsModule,
    MediaTypesModule,
    PaintTypesModule,
    ContactsModule,
    ChatModule,
    WallsModule,
    ShippingModule,
  ],
})
export class AppModule {}
