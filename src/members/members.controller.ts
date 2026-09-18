import {
  Controller, Get, Post, Body, Param,
  ParseIntPipe, UseGuards, Request,
} from '@nestjs/common';
import { MembersService } from './members.service';
import type { MemberPublic } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  // POST /api/members — Public: Register new member
  @Post()
  register(@Body() dto: CreateMemberDto): Promise<MemberPublic> {
    return this.membersService.create(dto);
  }

  // GET /api/members — Admin only
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  findAll(): Promise<MemberPublic[]> {
    return this.membersService.findAll();
  }

  // GET /api/members/stats — Admin only
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('stats')
  getStats(): Promise<object> {
    return this.membersService.getStats();
  }

  // GET /api/members/:id — Authenticated (own profile or admin)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<MemberPublic> {
    // Only allow access to own record unless admin
    if (req.user.role !== 'admin' && req.user.id !== id) {
      const { ForbiddenException } = require('@nestjs/common');
      throw new ForbiddenException('Access denied');
    }
    return this.membersService.findOne(id);
  }
}
