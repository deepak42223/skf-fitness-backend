import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactDto } from './dto/contact.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('contact')
export class ContactController {
  constructor(private contactService: ContactService) {}

  // POST /api/contact — Public
  @Post()
  submit(@Body() dto: ContactDto): Promise<{ success: boolean; message: string }> {
    return this.contactService.submit(dto);
  }

  // GET /api/contact — Admin only
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  findAll() {
    return this.contactService.findAll();
  }
}
