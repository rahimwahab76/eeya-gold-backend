import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class MembershipScheduler {
    private readonly logger = new Logger(MembershipScheduler.name);

    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService,
    ) { }

    // Run every day at 09:00 AM
    @Cron(CronExpression.EVERY_DAY_AT_9AM)
    async checkMembershipExpiry() {
        this.logger.log('Starting Daily Membership Expiry Check...');

        const now = new Date();
        const users = await this.prisma.user.findMany({
            where: {
                membershipExpiryDate: { not: null },
                isActive: true,
            }
        });

        for (const user of users) {
            if (!user.membershipExpiryDate) continue;

            const expiry = new Date(user.membershipExpiryDate);
            const diffTime = expiry.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Reminders at 14, 7, and 3 days
            if ([14, 7, 3].includes(diffDays)) {
                await this.notificationService.sendNotification(
                    user.id,
                    'Peringatan Yuran Tahunan Eeya Gold',
                    `Harap maklum, keahlian anda akan tamat dalam ${diffDays} hari lagi (${expiry.toLocaleDateString()}). Sila perbaharui segera untuk mengelakkan akaun disekat.`,
                    'WARNING'
                );
                this.logger.log(`Sent ${diffDays}-day reminder to ${user.email}`);
            }

            // Notify on Exact Expiry or Just Expired (Day 0)
            if (diffDays === 0 || diffDays === -1) {
                // Optional: Can verify inactive status here if we auto-lock
                // For now just notify
                await this.notificationService.sendNotification(
                    user.id,
                    'Keahlian Tamat Tempoh',
                    `Akaun anda telah disekat sementara kerana yuran tahunan belum dijelaskan. Sila hubungi admin untuk pengaktifan semula.`,
                    'ERROR'
                );
            }
        }
        this.logger.log('Membership check complete.');
    }
}
