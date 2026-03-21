import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from monorepo root (CWD is apps/api/ during deploy)
config({ path: resolve(process.cwd(), '../../.env') });
config(); // also try CWD/.env as fallback
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
import { TagEntity } from './tags/tag.entity';
import { ImageTagEntity } from './tags/image-tag.entity';

// Use same defaults as app.module.ts TypeOrmModule config
const ds = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 5432,
  database: process.env.DATABASE_NAME || 'gallery',
  username: process.env.DATABASE_USER || 'gallery_user',
  password: process.env.DATABASE_PASSWORD || '',
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
  ],
  synchronize: true,
});

ds.initialize()
  .then(() => {
    console.log('Database schema synchronized successfully');
    return ds.destroy();
  })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Schema sync failed:', err);
    process.exit(1);
  });
