import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class NotificationService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async markAsRead(id: string) {
        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
    }

    async sendNotification(userId: string, title: string, body: string, type: string = 'SYSTEM') {
        const notif = await this.prisma.notification.create({
            data: {
                userId,
                title,
                message: body,
                type
            }
        });
        console.log(`[Notification] To ${userId}: ${title} - ${body}`);
        return notif;
    }

    // Admin/Dev testing tool
    async createTestNotification(userId: string) {
        return this.sendNotification(
            userId,
            'Test Notification',
            'This is a test message triggered from the backend.',
            'TEST',
        );
    }

    async sendBroadcast(title: string, body: string, userIds?: string[]) {
        let targets = userIds;

        // If no specific targets provided, fetch ALL active users
        if (!targets || targets.length === 0) {
            const users = await this.prisma.user.findMany({
                where: { isActive: true },
                select: { id: true }
            });
            targets = users.map(u => u.id);
        }

        if (targets.length === 0) return { count: 0 };

        // Bulk insert notifications
        // Prisma createMany is efficient
        const notifications = targets.map(userId => ({
            userId,
            title,
            message: body,
            type: 'BROADCAST',
            isRead: false
        }));

        // Batching if necessary (e.g. 5000 at a time), but createMany handles reasonable sizes well
        // For 50k, maybe split into chunks of 1000
        const batchSize = 1000;
        let totalCount = 0;

        for (let i = 0; i < notifications.length; i += batchSize) {
            const batch = notifications.slice(i, i + batchSize);
            const result = await this.prisma.notification.createMany({
                data: batch
            });
            totalCount += result.count;
        }

        console.log(`[Broadcast] Sent "${title}" to ${totalCount} users.`);
        return { count: totalCount };
    }
}
