import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ImagesService } from '../images/images.service';

@Injectable()
export class AiService {
  private client: Anthropic;

  constructor(
    private readonly configService: ConfigService,
    private readonly imagesService: ImagesService,
  ) {
    this.client = new Anthropic({
      apiKey: this.configService.get('ANTHROPIC_API_KEY'),
    });
  }

  async describeImage(imageId: number) {
    const image = await this.imagesService.findOne(imageId);
    const uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
    const mediumPath = image.watermarkPath.replace('watermarked/', 'medium/');
    const filePath = path.join(uploadDir, mediumPath);

    const imageBuffer = await fs.readFile(filePath);
    const base64 = imageBuffer.toString('base64');

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/webp', data: base64 },
            },
            {
              type: 'text',
              text: `You are writing a description for a fine art photography gallery listing. Describe this photograph in a compelling, evocative way that would appeal to art collectors and photography enthusiasts. Include observations about:
- The mood and atmosphere
- Composition and visual elements
- What makes this image special or striking

Keep it under 150 words. Write in a refined, gallery-appropriate tone. Do not start with "This photograph" — vary your opening.`,
            },
          ],
        },
      ],
    });

    const description = response.content[0].type === 'text' ? response.content[0].text : '';
    return { description };
  }
}
