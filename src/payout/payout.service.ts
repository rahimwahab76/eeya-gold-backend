
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class PayoutService {
    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService
    ) { }

    async getPendingPayouts() {
        // Find users with bonus > 0
        const users = await this.prisma.user.findMany({
            where: {
                wallet: {
                    bonusBalance: { gt: 0 }
                }
            },
            include: {
                wallet: true,
                sponsor: {
                    select: { fullName: true, email: true }
                }
            }
        });

        // Format for UI
        return users.map(u => ({
            userId: u.id,
            fullName: u.fullName,
            email: u.email,
            phone: u.phone,
            bonusBalance: u.wallet?.bonusBalance || 0,
            salesPerformance: u.currentMonthPersonalSales, // For Admin to judge eligibility
            sponsorName: u.sponsor?.fullName || 'N/A'
        }));
    }

    async processPayout(adminId: string, userId: string, action: 'PAY' | 'FORFEIT') {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { wallet: true }
        });

        if (!user || !user.wallet) throw new NotFoundException('User or Wallet not found');

        const amount = user.wallet.bonusBalance;
        if (amount <= 0) throw new Error('No bonus to process');

        // 1. Reset Bonus Balance to 0
        await this.prisma.wallet.update({
            where: { userId },
            data: { bonusBalance: 0 }
        });

        if (action === 'PAY') {
            // Log as Paid
            await this.prisma.commissionLog.create({
                data: {
                    beneficiaryId: userId,
                    sourceUserId: adminId, // Admin initiated
                    transactionId: 'MANUAL_PAYOUT', // Placeholder
                    amount: amount,
                    type: 'PAYOUT_CASH',
                    description: `Manual Payout by Admin via Bank Transfer`
                }
            });

            // Log Audit
            await this.prisma.auditLog.create({
                data: {
                    action: 'PAYOUT_APPROVED',
                    performedBy: adminId,
                    targetUser: userId,
                    details: `Paid RM${amount} to ${user.fullName}`,
                }
            });

            // Notify User
            await this.notificationService.sendNotification(
                userId,
                'Bonus Payout Approved',
                `Your bonus of RM${amount} has been processed and credited to your bank account.`,
                'SUCCESS'
            );

        } else if (action === 'FORFEIT') {
            // Add to Dana Khas
            await this.prisma.specialFund.update({
                where: { id: 'fund-1' },
                data: { balance: { increment: amount } }
            });

            await this.prisma.specialFundLog.create({
                data: {
                    amount: amount,
                    type: 'IN',
                    description: `Forfeited Bonus from ${user.fullName} (Admin Decision)`
                }
            });

            // Log Audit
            await this.prisma.auditLog.create({
                data: {
                    action: 'PAYOUT_FORFEITED',
                    performedBy: adminId,
                    targetUser: userId,
                    details: `Forfeited RM${amount} from ${user.fullName} to Dana Khas`,
                }
            });

            // Notify User
            await this.notificationService.sendNotification(
                userId,
                'Bonus Not Eligible',
                `Your accumulated bonus of RM${amount} has been forfeited due to eligibility criteria. It has been diverted to Dana Khas.`,
                'WARNING'
            );
        }

        return { success: true, amount, action };
    }
}
