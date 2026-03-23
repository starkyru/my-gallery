import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactInquiryEntity } from './contact-inquiry.entity';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    @InjectRepository(ContactInquiryEntity)
    private readonly repo: Repository<ContactInquiryEntity>,
    private readonly authService: AuthService,
  ) {}

  async create(name: string, email: string, message: string) {
    const inquiry = await this.repo.save(this.repo.create({ name, email, message }));

    // Notify admins
    this.notifyAdmins(inquiry).catch((err) =>
      this.logger.error('Failed to send contact notification', err),
    );

    return inquiry;
  }

  async findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async markRead(id: number) {
    await this.repo.update(id, { read: true });
  }

  async remove(id: number) {
    await this.repo.delete(id);
  }

  private async notifyAdmins(inquiry: ContactInquiryEntity) {
    const admins = await this.authService.findNotifyAdmins();
    if (admins.length === 0) return;

    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const html = `
      <h2>New Contact Inquiry</h2>
      <p><strong>From:</strong> ${escapeHtml(inquiry.name)} &lt;${escapeHtml(inquiry.email)}&gt;</p>
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-line">${escapeHtml(inquiry.message)}</p>
    `;

    const safeName = inquiry.name.replace(/[\r\n]/g, ' ');
    for (const admin of admins) {
      try {
        await this.authService.sendEmail(admin.email, `Contact: ${safeName}`, html);
      } catch (err) {
        this.logger.error(`Failed to notify ${admin.email}`, err);
      }
    }
  }
}
