import {
  Controller, Get, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // GET /api/admin/dashboard
  @Get('dashboard')
  getDashboard(): Promise<object> {
    return this.adminService.getDashboard();
  }

  // GET /api/admin/members
  @Get('members')
  getAllMembers(): Promise<object> {
    return this.adminService.getAllMembers();
  }

  // GET /api/admin/members/:id
  @Get('members/:id')
  getMember(@Param('id', ParseIntPipe) id: number): Promise<object> {
    return this.adminService.getMemberById(id);
  }

  // GET /api/admin/stats
  @Get('stats')
  getStats(): Promise<object> {
    return this.adminService.getStats();
  }

  // GET /api/admin/messages
  @Get('messages')
  getMessages(): Promise<object> {
    return this.adminService.getMessages();
  }
}
