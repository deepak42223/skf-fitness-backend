import { Controller, Post, Get, Body } from '@nestjs/common';
import { ContactService } from './contact.service';
import type { ContactMessage } from './contact.service';
import { ContactDto } from './dto/contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private contactService: ContactService) {}

  // POST /api/contact
  @Post()
  submit(@Body() dto: ContactDto): { success: boolean; message: string } {
    return this.contactService.submit(dto);
  }

  // GET /api/contact
  @Get()
  findAll(): ContactMessage[] {
    return this.contactService.findAll();
  }
}
