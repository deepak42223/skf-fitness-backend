import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactEntity } from './contact.entity';
import { ContactDto } from './dto/contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactEntity)
    private repo: Repository<ContactEntity>,
  ) {}

  async submit(dto: ContactDto): Promise<{ success: boolean; message: string }> {
    const msg = this.repo.create({ ...dto, isRead: false });
    await this.repo.save(msg);
    return { success: true, message: 'Thank you! We will contact you shortly.' };
  }

  async findAll(): Promise<ContactEntity[]> {
    return this.repo.find({ order: { receivedAt: 'DESC' } });
  }

  async markRead(id: number): Promise<void> {
    await this.repo.update(id, { isRead: true });
  }
}
