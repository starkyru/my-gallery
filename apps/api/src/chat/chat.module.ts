import { Module } from '@nestjs/common';
import { ImagesModule } from '../images/images.module';
import { CategoriesModule } from '../categories/categories.module';
import { TagsModule } from '../tags/tags.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatThrottleGuard } from './chat-throttle.guard';

@Module({
  imports: [ImagesModule, CategoriesModule, TagsModule],
  controllers: [ChatController],
  providers: [ChatThrottleGuard, ChatService],
})
export class ChatModule {}
