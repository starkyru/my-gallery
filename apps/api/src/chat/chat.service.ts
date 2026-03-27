import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { ImagesService } from '../images/images.service';
import { CategoriesService } from '../categories/categories.service';
import { TagsService } from '../tags/tags.service';

const ChatAiResponseSchema = z.object({
  message: z.string().min(1),
  search: z
    .object({
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      keywords: z.string().optional(),
      featured: z.boolean().optional(),
      condition: z.enum(['AND', 'OR']).optional(),
    })
    .optional(),
});

export interface ChatImage {
  id: number;
  title: string;
  thumbnailPath: string;
  watermarkPath: string;
  width: number;
  height: number;
  price: number;
  artist: { name: string; slug: string };
}

export interface ChatResponse {
  message: string;
  images: ChatImage[];
  debug?: {
    search?: { category?: string; tags?: string[]; keywords?: string; featured?: boolean };
  };
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly client: Anthropic;

  constructor(
    private readonly configService: ConfigService,
    private readonly imagesService: ImagesService,
    private readonly categoriesService: CategoriesService,
    private readonly tagsService: TagsService,
  ) {
    this.client = new Anthropic({
      apiKey: this.configService.get('ANTHROPIC_API_KEY'),
    });
  }

  async chat(messages: { role: 'user' | 'assistant'; content: string }[]): Promise<ChatResponse> {
    const [categories, tags] = await Promise.all([
      this.categoriesService.findAll(),
      this.tagsService.findAll(),
    ]);

    const categoryList = categories
      .map((c) => `- ${c.slug} (${c.name}, ${c.imageCount} images)`)
      .join('\n');
    const tagList = tags.map((t) => `- ${t.slug} (${t.name}, ${t.imageCount} images)`).join('\n');

    const systemPrompt = `You are a friendly gallery assistant helping visitors find photographs.

AVAILABLE CATEGORIES (use exact slug values):
${categoryList}

AVAILABLE TAGS (use exact slug values):
${tagList}

When the user describes what they are looking for, respond with a JSON object:
{
  "message": "A friendly 1-2 sentence response",
  "search": {
    "category": "optional category slug from above",
    "tags": ["optional", "tag", "slugs"],
    "keywords": "optional keyword to search image descriptions (e.g. 'sunset', 'bridge', 'rain')",
    "featured": false,
    "condition": "AND or OR — use AND when the user wants all criteria combined (e.g. 'dog in a hat'), use OR when criteria are alternatives (e.g. 'sunset or beach'). Default: AND"
  }
}

If the user is just chatting or asking something completely unrelated to images (e.g. "hello", "what time is it"), respond with only:
{ "message": "Your friendly response" }

Rules:
- ALWAYS include a "search" object when the user mentions any subject, object, scene, mood, or style — even single words like "hat", "sunset", "dog". Never ask for clarification when you can search instead.
- Only set "featured" to true if the user explicitly asks for featured, popular, or best images. Otherwise omit it.
- Pick at most 1 category and up to 5 tags
- Only use slugs from the lists above
- Use keywords to search image descriptions when the user asks for something specific (e.g. a subject, object, or scene detail) that may not match a category or tag. For short queries, always use the query as a keyword.
- Keep messages concise and helpful
- Always prioritize the latest message. If the user changes topic or asks for something new, ignore previous requests and search based only on the latest message
- If you're not able to generate keywords, tags or categories, ask a clarifying question (no search)
- Respond ONLY with valid JSON, no markdown formatting`;

    const userMessages = messages.filter((m) => m.role === 'user').map((m) => m.content);

    const aiResult = await this.callAi(systemPrompt, userMessages);
    if (!aiResult) {
      return {
        message: "I'm sorry, I had trouble understanding. Could you try rephrasing?",
        images: [],
      };
    }

    const { message, search } = aiResult;

    if (!search) {
      return { message, images: [], debug: {} };
    }

    const validCategorySlugs = new Set(categories.map((c) => c.slug));
    const validTagSlugs = new Set(tags.map((t) => t.slug));

    const condition = search.condition ?? 'AND';
    let images = await this.searchImages(search, validCategorySlugs, validTagSlugs, condition);

    // Fallback: if AND returned nothing, retry with OR for broader results
    if (images.length === 0 && condition === 'AND') {
      images = await this.searchImages(search, validCategorySlugs, validTagSlugs, 'OR');
    }

    const finalMessage =
      images.length === 0
        ? `${message} Unfortunately, I couldn't find images matching that description. Try broadening your search or describing something different.`
        : message;

    return { message: finalMessage, images, debug: { search } };
  }

  private async searchImages(
    search: { category?: string; tags?: string[]; keywords?: string; featured?: boolean },
    validCategorySlugs: Set<string>,
    validTagSlugs: Set<string>,
    condition: 'AND' | 'OR',
  ): Promise<ChatImage[]> {
    const category =
      search.category && validCategorySlugs.has(search.category) ? search.category : undefined;
    const filteredTags = (search.tags ?? []).filter((t) => validTagSlugs.has(t));

    const allImages = await this.imagesService.findAll({
      category,
      tags: filteredTags.length > 0 ? filteredTags : undefined,
      search: search.keywords || undefined,
      featured: search.featured,
      condition,
    });

    return allImages.slice(0, 3).map((img) => ({
      id: img.id,
      title: img.title ?? '',
      thumbnailPath: img.thumbnailPath,
      watermarkPath: img.watermarkPath,
      width: img.width,
      height: img.height,
      price: Number(img.price),
      artist: {
        name: img.artist?.name ?? '',
        slug: img.artist?.slug ?? '',
      },
    }));
  }

  private async callAi(
    systemPrompt: string,
    userMessages: string[],
  ): Promise<z.infer<typeof ChatAiResponseSchema> | null> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages: userMessages.map((content) => ({ role: 'user' as const, content })),
      });

      const raw = response.content[0].type === 'text' ? response.content[0].text : '';
      const text = raw
        .replace(/^```(?:json)?\s*\n?/i, '')
        .replace(/\n?\s*```$/g, '')
        .trim();

      const parsed = JSON.parse(text);
      const result = ChatAiResponseSchema.safeParse(parsed);
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }
}
