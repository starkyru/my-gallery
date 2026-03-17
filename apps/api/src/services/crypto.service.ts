import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const hex = this.configService.get<string>('SERVICE_ENCRYPTION_KEY', '');
    if (hex.length !== 64) {
      // Allow startup without key — encrypt/decrypt will throw at call time
      this.key = Buffer.alloc(32);
    } else {
      this.key = Buffer.from(hex, 'hex');
    }
  }

  encrypt(plaintext: string): string {
    if (this.key.every((b) => b === 0)) {
      throw new Error('SERVICE_ENCRYPTION_KEY is not configured');
    }
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(encrypted: string): string {
    if (this.key.every((b) => b === 0)) {
      throw new Error('SERVICE_ENCRYPTION_KEY is not configured');
    }
    const [ivHex, authTagHex, ciphertextHex] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(ciphertext) + decipher.final('utf8');
  }
}
