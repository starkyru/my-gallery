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
import { ArtistEntity } from './artists/artist.entity';
import { ImageEntity } from './images/image.entity';
import { OrderEntity } from './orders/order.entity';
import { OrderItemEntity } from './orders/order-item.entity';
import { AdminUserEntity } from './auth/admin-user.entity';
import { ImagePrintOptionEntity } from './images/image-print-option.entity';
import { ServiceConfigEntity } from './services/service-config.entity';

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
  ],
})
export class AppModule {}
