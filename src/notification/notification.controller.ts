import { Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get()
    findAll(@Query('userId') userId: string) {
        // In a real app, userId would be extracted from the JWT token
        return this.notificationService.findAll(userId || 'user-1');
    }

    @Patch(':id/read')
    markAsRead(@Param('id') id: string) {
        return this.notificationService.markAsRead(id);
    }

    @Patch('read-all')
    markAllAsRead(@Query('userId') userId: string) {
        // In a real app, userId comes from AuthGuard/Decorator
        return this.notificationService.markAllAsRead(userId || 'user-1');
    }

    @Post('test')
    createTest(@Query('userId') userId: string) {
        return this.notificationService.createTestNotification(userId || 'user-1');
    }
}
