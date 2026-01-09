
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class WalletService {
    constructor(
        private prisma: PrismaService,
        private auditService: AuditService,
        private notificationService: NotificationService
    ) { }

    // 1. User Requests Top-up
    async requestTopUp(userId: string, amount: number, proofImageUrl: string, purpose: string = 'E_CREDIT') {
        if (amount <= 0) throw new BadRequestException('Amount must be positive');

        const request = await this.prisma.topUpRequest.create({
            data: {
                userId,
                amount,
                proofImageUrl,
                purpose,
                status: 'PENDING'
            }
        });

        // Notify Admins? (Optional - maybe later)
        return request;
    }

    // 2. Admin Lists Pending Requests
    async getPendingTopUps() {
        return this.prisma.topUpRequest.findMany({
            where: { status: 'PENDING' },
            include: { user: { select: { fullName: true, email: true, phone: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }

    async creditRebate(adminId: string, userId: string, amount: number, reason: string) {
        if (amount <= 0) throw new BadRequestException('Amount must be positive');

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        await this.prisma.wallet.update({
            where: { userId },
            data: { rebateBalance: { increment: amount } }
        });

        await this.auditService.logAction(adminId, 'CREDIT_REBATE', `Added RM${amount} rebate to ${user.fullName}. Reason: ${reason}`, userId);

        await this.notificationService.sendNotification(
            userId,
            'E-Rebate Received',
            `You received RM${amount} E-Rebate! Reason: ${reason}`,
            'SUCCESS'
        );

        return { success: true };
    }

    // 3. Admin Approves Top-up
    async approveTopUp(adminId: string, requestId: string, finalAmount: number, targetType?: string) {
        // Validate Admin
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin) throw new NotFoundException('Admin not found. Please re-login.');

        const request = await this.prisma.topUpRequest.findUnique({ where: { id: requestId } });
        if (!request) throw new NotFoundException('Request not found');
        if (request.status !== 'PENDING') throw new BadRequestException('Request already processed');

        const user = await this.prisma.user.findUnique({ where: { id: request.userId } });
        const userName = user ? user.fullName : 'Unknown User';

        // Default target if not provided
        const destination = targetType || request.purpose || 'E_CREDIT';

        // Transaction: Update Request + Route Funds
        await this.prisma.$transaction(async (tx) => {
            // A. Update Request
            await tx.topUpRequest.update({
                where: { id: requestId },
                data: {
                    status: 'APPROVED',
                    amount: finalAmount, // Update amount if admin corrected it
                    approvedBy: adminId,
                    approvedAt: new Date()
                }
            });

            // B. Route Funds based on Destination
            if (destination === 'E_CREDIT') {
                // Credit User Wallet
                let wallet = await tx.wallet.findUnique({ where: { userId: request.userId } });
                if (!wallet) {
                    wallet = await tx.wallet.create({
                        data: { userId: request.userId, creditBalance: 0, rebateBalance: 0, bonusBalance: 0, goldBalance: 0 }
                    });
                }
                const newBalance = wallet.creditBalance + finalAmount;

                await tx.wallet.update({
                    where: { userId: request.userId },
                    data: { creditBalance: { increment: finalAmount } }
                });

                // 2. Record in EKreditLedger (Grand Ledger D)
                await tx.eKreditLedger.create({
                    data: {
                        userId: request.userId,
                        refNo: `TOPUP-${requestId.substring(0, 8).toUpperCase()}`,
                        inRM: finalAmount,
                        outRM: 0,
                        balanceRM: newBalance
                    }
                });

            } else if (destination === 'ANNUAL_FEE') {
                // Credit MembershipFeeLedger (Grand Ledger E)
                await tx.membershipFeeLedger.create({
                    data: {
                        userId: request.userId,
                        type: 'ANNUAL',
                        amountRM: finalAmount
                    }
                });
                // Note: Revenue flows to Equity (P&L) eventually, usually via a nightly job or real-time snapshot
                // For now, we just record the Fee collection.

            } else if (destination === 'SPECIAL_FEE') {
                // Credit Special Fund Ledger (Grand Ledger E)
                // Assuming Special Fees flow into "SpecialFund" (Dana Khas) or similar
                // We use SpecialFundLedger updated with a SOURCE type.

                await tx.specialFundLedger.create({
                    data: {
                        month: new Date().toISOString().slice(0, 7), // YYYY-MM
                        source: 'SPECIAL_FEE_TOPUP',
                        inRM: finalAmount,
                        outRM: 0,
                        balanceRM: finalAmount // In a real app, we'd query previous balance + this. Simplified for now.
                    }
                });
            }
        });

        // C. Log Audit & Notify
        await this.auditService.logAction(adminId, 'APPROVE_TOPUP', `Approved Top-up RM${finalAmount} for ${userName} (${request.userId}) -> ${destination}`, request.userId);

        await this.notificationService.sendNotification(
            request.userId,
            'Top-up/Payment Successful',
            `Your payment of RM${finalAmount} has been approved as ${destination}.`,
            'SUCCESS'
        );

        return { success: true };
    }

    // 4. Admin Rejects Top-up
    async rejectTopUp(adminId: string, requestId: string, reason: string) {
        // Validate Admin
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin) throw new NotFoundException('Admin not found. Please re-login.');

        const request = await this.prisma.topUpRequest.findUnique({ where: { id: requestId } });
        if (!request) throw new NotFoundException('Request not found');
        if (request.status !== 'PENDING') throw new BadRequestException('Request already processed');

        const user = await this.prisma.user.findUnique({ where: { id: request.userId } });
        const userName = user ? user.fullName : 'Unknown User';

        await this.prisma.topUpRequest.update({
            where: { id: requestId },
            data: {
                status: 'REJECTED',
                rejectionReason: reason,
                approvedBy: adminId, // Still tracked who handled it
                approvedAt: new Date()
            }
        });

        await this.auditService.logAction(adminId, 'REJECT_TOPUP', `Rejected Top-up for ${userName}. Reason: ${reason}`, request.userId);

        await this.notificationService.sendNotification(
            request.userId,
            'Top-up Rejected',
            `Your top-up request was rejected. Reason: ${reason}`,
            'ERROR'
        );

        return { success: true };
    }
}
