import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // GET /api/admin/dashboard
  @Get('dashboard')
  getDashboard(): object {
    return this.adminService.getDashboard();
  }

  // GET /api/admin/members
  @Get('members')
  getAllMembers(): object {
    return this.adminService.getAllMembers();
  }

  // GET /api/admin/members/:id
  @Get('members/:id')
  getMember(@Param('id', ParseIntPipe) id: number): object {
    return this.adminService.getMemberById(id);
  }

  // GET /api/admin/stats
  @Get('stats')
  getStats(): object {
    return this.adminService.getStats();
  }

  // GET /api/admin/messages
  @Get('messages')
  getMessages(): object {
    return this.adminService.getMessages();
  }
}
