import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactInquiryEntity } from './contact-inquiry.entity';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([ContactInquiryEntity]), AuthModule],
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}
