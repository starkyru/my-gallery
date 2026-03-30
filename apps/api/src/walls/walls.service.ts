import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import { WallBackgroundEntity } from './wall-background.entity';
import { FramePresetEntity } from './frame-preset.entity';

const ALLOWED_FORMATS = ['jpeg', 'png', 'webp', 'tiff'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const DEFAULT_FRAMES: Partial<FramePresetEntity>[] = [
  {
    name: 'None',
    borderColor: 'transparent',
    borderWidthMm: 0,
    matColor: 'transparent',
    matWidthMm: 0,
    shadowEnabled: true,
    sortOrder: 0,
  },
  {
    name: 'Thin Black',
    borderColor: '#1a1a1a',
    borderWidthMm: 8,
    matColor: 'transparent',
    matWidthMm: 0,
    shadowEnabled: true,
    sortOrder: 1,
  },
  {
    name: 'White Mat',
    borderColor: '#2a2a2a',
    borderWidthMm: 6,
    matColor: '#f5f5f0',
    matWidthMm: 40,
    shadowEnabled: true,
    sortOrder: 2,
  },
  {
    name: 'Dark Wood',
    borderColor: '#3e2723',
    borderWidthMm: 15,
    matColor: 'transparent',
    matWidthMm: 0,
    shadowEnabled: true,
    sortOrder: 3,
  },
  {
    name: 'Light Wood',
    borderColor: '#a1887f',
    borderWidthMm: 15,
    matColor: '#fafafa',
    matWidthMm: 30,
    shadowEnabled: true,
    sortOrder: 4,
  },
];

@Injectable()
export class WallsService implements OnModuleInit {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(WallBackgroundEntity)
    private readonly wallRepo: Repository<WallBackgroundEntity>,
    @InjectRepository(FramePresetEntity)
    private readonly frameRepo: Repository<FramePresetEntity>,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
  }

  async onModuleInit() {
    const count = await this.frameRepo.count();
    if (count === 0) {
      await this.frameRepo.save(DEFAULT_FRAMES.map((f) => this.frameRepo.create(f)));
    }
  }

  async findAllWalls(): Promise<WallBackgroundEntity[]> {
    return this.wallRepo.find({ order: { sortOrder: 'ASC', createdAt: 'DESC' } });
  }

  async createWall(
    file: Express.Multer.File,
    dto: {
      name: string;
      wallWidthCm?: number;
      wallHeightCm?: number;
      anchorX?: number;
      anchorY?: number;
    },
  ): Promise<WallBackgroundEntity> {
    const id = crypto.randomUUID();
    const wallsDir = path.join(this.uploadDir, 'walls');
    const thumbsDir = path.join(this.uploadDir, 'walls', 'thumbs');
    await fs.mkdir(wallsDir, { recursive: true });
    await fs.mkdir(thumbsDir, { recursive: true });

    if (!file?.buffer) {
      throw new BadRequestException('File is required');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File too large (max 20MB)');
    }

    const image = sharp(file.buffer);
    const metadata = await image.metadata();
    if (!metadata.format || !ALLOWED_FORMATS.includes(metadata.format)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, and TIFF images are allowed');
    }
    if (!metadata.width || !metadata.height) {
      throw new BadRequestException('Could not read image dimensions');
    }

    const resized = image.resize({ width: 2400, withoutEnlargement: true });
    const resizedMeta = await resized.clone().toBuffer({ resolveWithObject: true });

    await resized
      .clone()
      .webp({ quality: 90 })
      .toFile(path.join(wallsDir, `${id}.webp`));
    await sharp(file.buffer)
      .resize({ width: 200 })
      .webp({ quality: 80 })
      .toFile(path.join(thumbsDir, `${id}.webp`));

    const wall = this.wallRepo.create({
      name: dto.name,
      imagePath: `walls/${id}.webp`,
      thumbnailPath: `walls/thumbs/${id}.webp`,
      wallWidthCm: dto.wallWidthCm ?? null,
      wallHeightCm: dto.wallHeightCm ?? null,
      anchorX: dto.anchorX ?? 0.5,
      anchorY: dto.anchorY ?? 0.5,
      imageWidth: resizedMeta.info.width,
      imageHeight: resizedMeta.info.height,
    });

    return this.wallRepo.save(wall);
  }

  async updateWall(
    id: number,
    dto: Partial<{
      name: string;
      wallWidthCm: number | null;
      wallHeightCm: number | null;
      anchorX: number;
      anchorY: number;
      isDefault: boolean;
      sortOrder: number;
    }>,
  ): Promise<WallBackgroundEntity> {
    const wall = await this.wallRepo.findOneBy({ id });
    if (!wall) throw new NotFoundException('Wall background not found');
    if (dto.name !== undefined) wall.name = dto.name;
    if (dto.wallWidthCm !== undefined) wall.wallWidthCm = dto.wallWidthCm;
    if (dto.wallHeightCm !== undefined) wall.wallHeightCm = dto.wallHeightCm;
    if (dto.anchorX !== undefined) wall.anchorX = dto.anchorX;
    if (dto.anchorY !== undefined) wall.anchorY = dto.anchorY;
    if (dto.isDefault !== undefined) wall.isDefault = dto.isDefault;
    if (dto.sortOrder !== undefined) wall.sortOrder = dto.sortOrder;
    return this.wallRepo.save(wall);
  }

  async removeWall(id: number): Promise<void> {
    const wall = await this.wallRepo.findOneBy({ id });
    if (!wall) throw new NotFoundException('Wall background not found');

    const imgPath = path.resolve(this.uploadDir, wall.imagePath);
    const thumbPath = path.resolve(this.uploadDir, wall.thumbnailPath);
    const uploadsRoot = path.resolve(this.uploadDir);
    if (imgPath.startsWith(uploadsRoot)) {
      await fs.unlink(imgPath).catch(() => {});
    }
    if (thumbPath.startsWith(uploadsRoot)) {
      await fs.unlink(thumbPath).catch(() => {});
    }
    await this.wallRepo.remove(wall);
  }

  async findAllFrames(): Promise<FramePresetEntity[]> {
    return this.frameRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async findEnabledFrames(): Promise<FramePresetEntity[]> {
    return this.frameRepo.find({ where: { enabled: true }, order: { sortOrder: 'ASC' } });
  }

  async updateFrame(
    id: number,
    dto: Partial<{
      name: string;
      borderColor: string;
      borderWidthMm: number;
      matColor: string;
      matWidthMm: number;
      shadowEnabled: boolean;
      enabled: boolean;
      sortOrder: number;
    }>,
  ): Promise<FramePresetEntity> {
    const frame = await this.frameRepo.findOneBy({ id });
    if (!frame) throw new NotFoundException('Frame preset not found');
    if (dto.name !== undefined) frame.name = dto.name;
    if (dto.borderColor !== undefined) frame.borderColor = dto.borderColor;
    if (dto.borderWidthMm !== undefined) frame.borderWidthMm = dto.borderWidthMm;
    if (dto.matColor !== undefined) frame.matColor = dto.matColor;
    if (dto.matWidthMm !== undefined) frame.matWidthMm = dto.matWidthMm;
    if (dto.shadowEnabled !== undefined) frame.shadowEnabled = dto.shadowEnabled;
    if (dto.enabled !== undefined) frame.enabled = dto.enabled;
    if (dto.sortOrder !== undefined) frame.sortOrder = dto.sortOrder;
    return this.frameRepo.save(frame);
  }
}
