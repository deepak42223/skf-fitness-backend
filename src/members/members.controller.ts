import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { MembersService } from './members.service';
import type { MemberPublic } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  // POST /api/members — Register new member
  @Post()
  register(@Body() dto: CreateMemberDto): Promise<MemberPublic> {
    return this.membersService.create(dto);
  }

  // GET /api/members — Get all members
  @Get()
  findAll(): MemberPublic[] {
    return this.membersService.findAll();
  }

  // GET /api/members/stats
  @Get('stats')
  getStats(): object {
    return this.membersService.getStats();
  }

  // GET /api/members/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): object {
    return this.membersService.findOne(id);
  }
}
