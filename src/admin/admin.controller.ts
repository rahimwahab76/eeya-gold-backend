import { Controller, Get, Param, Post, Put, Body, UseGuards, Req, Query } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
    constructor(private adminService: AdminService) { }

    @Get('users/pending')
    getPendingUsers() {
        return this.adminService.getPendingUsers();
    }

    @Get('users')
    getAllUsers(@Query('q') query?: string) {
        return this.adminService.getAllUsers(query);
    }

    @Post('users/approve/:id')
    approveUser(@Param('id') id: string) {
        return this.adminService.approveUser(id);
    }

    @Put('users/:id/role')
    updateUserRole(@Param('id') id: string, @Body() body: { role: string }) {
        return this.adminService.updateUserRole('admin-id', id, body.role);
    }

    @Put('users/:id/admin-status')
    updateAdminStatus(@Param('id') id: string, @Body() body: { status: string }) {
        return this.adminService.updateAdminStatus(id, body.status);
    }

    @Put('users/:id/status')
    async updateUserStatus(
        @Param('id') id: string,
        @Body() body: { status: string; reason: string },
        @Req() req
    ) {
        // Enforce Super Admin or Audit Only
        const adminId = req.user?.id || 'admin-id';
        return this.adminService.updateUserStatus(adminId, id, body.status, body.reason);
    }
    @Post('broadcast')
    async sendBroadcast(@Body() body: { title: string; body: string; target: 'ALL' | 'SPECIFIC'; userIds?: string[]; performingAdminId: string }) {
        // Fallback for backward compatibility or direct API calls (e.g. Postman without ID)
        // But for mobile app usage, performingAdminId should be passed
        const adminId = body.performingAdminId || 'admin-id';
        return this.adminService.sendBroadcast(adminId, body.title, body.body, body.target, body.userIds);
    }
    @Post('membership/renew/:userId')
    async renewUserMembership(
        @Param('userId') userId: string,
        @Req() req
    ) {
        const adminId = req.user?.id || 'admin-id';
        return this.adminService.renewUserMembership(adminId, userId);
    }
}
