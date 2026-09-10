import { Injectable } from '@nestjs/common';
import { ContactDto } from './dto/contact.dto';

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  receivedAt: Date;
  isRead: boolean;
}

@Injectable()
export class ContactService {
  private messages: ContactMessage[] = [];
  private nextId = 1;

  submit(dto: ContactDto): { success: boolean; message: string } {
    this.messages.push({
      id: this.nextId++,
      ...dto,
      receivedAt: new Date(),
      isRead: false,
    });
    return {
      success: true,
      message: 'Thank you! We will contact you shortly.',
    };
  }

  findAll(): ContactMessage[] {
    return this.messages;
  }
}
