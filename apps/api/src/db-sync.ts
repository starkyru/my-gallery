import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ArtistEntity } from './artists/artist.entity';
import { ImageEntity } from './images/image.entity';
import { ImagePrintOptionEntity } from './images/image-print-option.entity';
import { OrderEntity } from './orders/order.entity';
import { OrderItemEntity } from './orders/order-item.entity';
import { AdminUserEntity } from './auth/admin-user.entity';
import { ServiceConfigEntity } from './services/service-config.entity';
import { GalleryConfigEntity } from './gallery-config/gallery-config.entity';
import { CategoryEntity } from './categories/category.entity';
import { ProjectEntity } from './projects/project.entity';
import { ProtectedGalleryEntity } from './protected-galleries/protected-gallery.entity';
import { ProtectedGalleryImageEntity } from './protected-galleries/protected-gallery-image.entity';

const required = ['DATABASE_HOST', 'DATABASE_USER', 'DATABASE_PASSWORD', 'DATABASE_NAME'] as const;
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT) || 5432,
  database: process.env.DATABASE_NAME,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
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
  ],
  synchronize: true,
});

ds.initialize()
  .then(() => {
    console.log('Database schema synchronized successfully');
    return ds.destroy();
  })
  .then(() => process.exit(0))
  .catch(() => {
    console.error('Schema sync failed');
    process.exit(1);
  });
