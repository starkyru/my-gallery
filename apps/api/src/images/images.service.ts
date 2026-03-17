import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import { ImageEntity } from './image.entity';
import { ImagePrintOptionEntity } from './image-print-option.entity';
import { ImageCategory } from '@gallery/shared';

const ALLOWED_FORMATS = ['jpeg', 'png', 'webp', 'tiff'];

@Injectable()
export class ImagesService {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(ImageEntity)
    private readonly repo: Repository<ImageEntity>,
    @InjectRepository(ImagePrintOptionEntity)
    private readonly printOptionRepo: Repository<ImagePrintOptionEntity>,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
  }

  private getSigningKey(): string {
    return (
      this.configService.get<string>('DOWNLOAD_SIGNING_KEY') ||
      this.configService.get<string>('JWT_SECRET') ||
      'dev-secret-change-me'
    );
  }

  findAll(query?: { category?: ImageCategory; featured?: boolean }) {
    const qb = this.repo
      .createQueryBuilder('image')
      .leftJoinAndSelect('image.photographer', 'photographer')
      .leftJoinAndSelect('image.printOptions', 'printOptions')
      .orderBy('image.sortOrder', 'ASC')
      .addOrderBy('image.createdAt', 'DESC');

    if (query?.category) {
      qb.andWhere('image.category = :category', { category: query.category });
    }
    if (query?.featured !== undefined) {
      qb.andWhere('image.isFeatured = :featured', { featured: query.featured });
    }

    return qb.getMany();
  }

  async findOne(id: number) {
    const image = await this.repo.findOne({
      where: { id },
      relations: ['photographer', 'printOptions'],
    });
    if (!image) throw new NotFoundException('Image not found');
    return image;
  }

  async upload(file: Express.Multer.File, data: Partial<ImageEntity>) {
    // Validate actual image content using sharp
    const metadata = await sharp(file.buffer).metadata();
    if (!metadata.format || !ALLOWED_FORMATS.includes(metadata.format)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, and TIFF images are allowed');
    }

    const id = crypto.randomUUID();
    const ext = '.' + (metadata.format === 'jpeg' ? 'jpg' : metadata.format);

    const dirs = ['originals', 'thumbnails', 'medium', 'watermarked'].map((d) =>
      path.join(this.uploadDir, d),
    );
    await Promise.all(dirs.map((d) => fs.mkdir(d, { recursive: true })));

    const originalPath = path.join(this.uploadDir, 'originals', `${id}${ext}`);
    const thumbnailPath = path.join(this.uploadDir, 'thumbnails', `${id}.webp`);
    const mediumPath = path.join(this.uploadDir, 'medium', `${id}.webp`);
    const watermarkPath = path.join(this.uploadDir, 'watermarked', `${id}.webp`);

    await fs.writeFile(originalPath, file.buffer);

    await Promise.all([
      sharp(file.buffer).resize(400).webp({ quality: 80 }).toFile(thumbnailPath),
      sharp(file.buffer).resize(1200).webp({ quality: 85 }).toFile(mediumPath),
      this.createWatermarked(file.buffer, watermarkPath, metadata.width || 1200),
    ]);

    const image = this.repo.create({
      ...data,
      filePath: `originals/${id}${ext}`,
      thumbnailPath: `thumbnails/${id}.webp`,
      watermarkPath: `watermarked/${id}.webp`,
      width: metadata.width || 0,
      height: metadata.height || 0,
    });

    return this.repo.save(image);
  }

  private async createWatermarked(buffer: Buffer, outputPath: string, width: number) {
    const fontSize = Math.max(16, Math.round(width * 0.03));
    const svg = `<svg width="${width}" height="${fontSize * 2}">
      <text x="50%" y="50%" font-family="sans-serif" font-size="${fontSize}"
        fill="white" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle">
        gallery.ilia.to
      </text>
    </svg>`;

    await sharp(buffer)
      .resize(1200)
      .composite([{ input: Buffer.from(svg), gravity: 'southeast' }])
      .webp({ quality: 85 })
      .toFile(outputPath);
  }

  async update(id: number, data: Record<string, unknown>) {
    await this.findOne(id);
    const { printOptions, ...imageData } = data;
    if (Object.keys(imageData).length > 0) {
      await this.repo.update(id, imageData);
    }
    if (printOptions !== undefined) {
      await this.printOptionRepo.delete({ imageId: id });
      const opts = printOptions as { sku: string; description: string; price: number }[];
      if (opts.length > 0) {
        const entities = opts.map((opt) => this.printOptionRepo.create({ ...opt, imageId: id }));
        await this.printOptionRepo.save(entities);
      }
    }
    return this.findOne(id);
  }

  async updateSortOrder(updates: { id: number; sortOrder: number }[]) {
    await Promise.all(updates.map((u) => this.repo.update(u.id, { sortOrder: u.sortOrder })));
  }

  async remove(id: number) {
    const image = await this.findOne(id);
    const paths = [image.filePath, image.thumbnailPath, image.watermarkPath].map((p) =>
      path.join(this.uploadDir, p),
    );
    await Promise.all(paths.map((p) => fs.unlink(p).catch(() => {})));
    await this.repo.delete(id);
  }

  async incrementPrintsSold(imageId: number, printLimit: number | null): Promise<boolean> {
    const qb = this.repo
      .createQueryBuilder()
      .update()
      .set({ printsSold: () => 'prints_sold + 1' })
      .where('id = :id', { id: imageId });

    if (printLimit !== null) {
      qb.andWhere('prints_sold < :limit', { limit: printLimit });
    }

    const result = await qb.execute();
    return (result.affected ?? 0) > 0;
  }

  generateDownloadUrl(imageId: number): string {
    const secret = this.getSigningKey();
    const expires = Date.now() + 24 * 60 * 60 * 1000;
    const data = `${imageId}:${expires}`;
    const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
    const publicUrl = this.configService.get('PUBLIC_URL', 'http://localhost:4000');
    return `${publicUrl}/api/images/${imageId}/download?expires=${expires}&sig=${signature}`;
  }

  verifyDownloadSignature(imageId: number, expires: string, signature: string): boolean {
    if (Date.now() > parseInt(expires)) return false;
    const secret = this.getSigningKey();
    const data = `${imageId}:${expires}`;
    const expected = crypto.createHmac('sha256', secret).update(data).digest('hex');
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  }
}
