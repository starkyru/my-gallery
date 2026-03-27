import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ImagesService } from '../images/images.service';

const AiResponseSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

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

    // Step 1: Haiku describes what it sees (vision task)
    let visionResponse: Anthropic.Message;
    try {
      visionResponse = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
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
                text: `Describe what you see in this photograph. Include subjects, setting, lighting, mood, colors, and any notable details. Be factual and specific. Respond with a JSON object:

1. "title": a descriptive title (up to 20 words) capturing the key subject and setting.
2. "description": up to 6 sentences describing what you see in detail.

Respond ONLY with valid JSON, no markdown formatting.`,
              },
            ],
          },
        ],
      });
    } catch (err: unknown) {
      if (err instanceof Anthropic.APIError) {
        const body = err.error as { error?: { message?: string } } | undefined;
        const msg = body?.error?.message || err.message;
        throw new InternalServerErrorException(msg);
      }
      throw new InternalServerErrorException('AI service unavailable');
    }

    const visionRaw =
      visionResponse.content[0].type === 'text' ? visionResponse.content[0].text : '';
    const visionText = visionRaw
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?\s*```$/g, '')
      .trim();
    let visionParsed: unknown;
    try {
      visionParsed = JSON.parse(visionText);
    } catch {
      throw new BadRequestException('AI vision step returned invalid JSON');
    }
    const visionResult = AiResponseSchema.safeParse(visionParsed);
    if (!visionResult.success) {
      throw new BadRequestException(
        `AI vision response missing fields: ${visionResult.error.issues.map((i) => i.path.join('.')).join(', ')}`,
      );
    }

    // Save Haiku's vision output to help chatbot search
    await this.imagesService.updateAiDescription(
      imageId,
      `${visionResult.data.title}. ${visionResult.data.description}`,
    );

    const photographerContext =
      image.title || image.description
        ? `The photographer provided this context. Preserve the key details and intent, but rewrite in your own words. Ignore any file names or codes (like PA1345, IMG_2030, DSC0042, etc.):\nTitle: "${image.title || ''}"\n${image.description ? `Description: "${image.description}"` : ''}`
        : '';

    // Step 2: Sonnet writes the gallery copy (text-only)
    let writingResponse: Anthropic.Message;
    try {
      writingResponse = await this.client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        messages: [
          {
            role: 'user',
            content: `You are writing for a photography gallery. Write like a real person, not a copywriter. Use simple, everyday words. Do not use the em dash character. Respond with a JSON object containing two fields:

1. "title": a short title (2-6 words). Be creative and varied. Avoid generic patterns like "Noun in/on/at Place". Try different styles: a feeling, a question, a single word, a fragment, something unexpected or playful.

2. "description": 2-3 sentences about what makes this photo interesting. Write naturally, as if telling a friend about the photo. No flowery language, no art jargon. Keep it under 60 words. Do not start with "This photograph" or "This image".

Here is what the photo shows:
Title: "${visionResult.data.title}"
Description: "${visionResult.data.description}"

${photographerContext}

Respond ONLY with valid JSON, no markdown formatting.`,
          },
        ],
      });
    } catch (err: unknown) {
      if (err instanceof Anthropic.APIError) {
        const body = err.error as { error?: { message?: string } } | undefined;
        const msg = body?.error?.message || err.message;
        throw new InternalServerErrorException(msg);
      }
      throw new InternalServerErrorException('AI service unavailable');
    }

    const raw = writingResponse.content[0].type === 'text' ? writingResponse.content[0].text : '';
    const text = raw
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?\s*```$/g, '')
      .trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new BadRequestException('AI returned invalid JSON');
    }
    const result = AiResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new BadRequestException(
        `AI response missing fields: ${result.error.issues.map((i) => i.path.join('.')).join(', ')}`,
      );
    }
    return result.data;
  }
}
