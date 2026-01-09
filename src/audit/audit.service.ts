
import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    // 1. General Audit Trail (For Admin Audit & Super Admin)
    async getAuditLogs(userId: string, role: string) {
        // 1. SUPER_ADMIN: See ALL
        if (role === 'SUPER_ADMIN') {
            const logs = await this.prisma.auditLog.findMany({
                take: 50,
                orderBy: { timestamp: 'desc' },
                include: {
                    performer: {
                        select: { fullName: true, role: true, email: true }
                    }
                }
            });
            if (logs.length > 0) {
                console.log('[AUDIT SERVICE RETURN]', JSON.stringify(logs[0], null, 2));
            }
            return logs;
        }

        // 2. ADMIN_AUDIT: See ALL EXCEPT Super Admin
        if (role === 'ADMIN_AUDIT') {
            // Get IDs of Super Admins to exclude
            const superAdmins = await this.prisma.user.findMany({
                where: { role: 'SUPER_ADMIN' },
                select: { id: true }
            });
            const superAdminIds = superAdmins.map(u => u.id);

            const logs = await this.prisma.auditLog.findMany({
                where: {
                    performedBy: { notIn: superAdminIds }
                },
                take: 50,
                orderBy: { timestamp: 'desc' },
                include: {
                    performer: {
                        select: { fullName: true, role: true, email: true }
                    }
                }
            });
            if (logs.length > 0) console.log('[AUDIT ADMIN_AUDIT]', JSON.stringify(logs[0], null, 2));
            return logs;
        }

        // 3. ADMIN_SUPPORT / ADMIN / others: See OWN logs only
        if (role === 'ADMIN_SUPPORT' || role === 'ADMIN') {
            return this.prisma.auditLog.findMany({
                where: { performedBy: userId },
                take: 50,
                orderBy: { timestamp: 'desc' },
                include: {
                    performer: {
                        select: { fullName: true, role: true, email: true }
                    }
                }
            });
        }

        // 4. Default: User or unauthorized
        throw new UnauthorizedException('Access Denied');
    }

    async logAction(performedBy: string, action: string, details: string, targetUser?: string) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    action,
                    performedBy,
                    details,
                    targetUser
                }
            });
            console.log(`[AUDIT] Action Logged: ${action} by ${performedBy}`);
        } catch (e) {
            console.error('[AUDIT] Failed to log action:', e);
            // Don't throw, just log error so main flow isn't interrupted
        }
    }

    // 2. Dana Khas Info (Super Admin ONLY)
    async getDanaKhasInfo(userId: string, role: string) {
        if (role !== 'SUPER_ADMIN') {
            throw new UnauthorizedException('Only Super Admin can access Dana Khas');
        }

        const fund = await this.prisma.specialFund.findFirst();
        const logs = await this.prisma.specialFundLog.findMany();

        return {
            balance: fund?.balance || 0,
            logs: logs || [],
        };
    }

    // 3. Withdraw from Dana Khas (Super Admin ONLY)
    async withdrawDanaKhas(userId: string, role: string, amount: number, to: string, purpose: string) {
        if (role !== 'SUPER_ADMIN') {
            throw new UnauthorizedException('Only Super Admin can withdraw');
        }

        const fund = await this.prisma.specialFund.findFirst();
        if (!fund || fund.balance < amount) {
            throw new Error('Insufficient funds in Dana Khas');
        }

        // 1. Deduct Balance
        // 1. Deduct Balance
        await this.prisma.specialFund.update({
            where: { id: fund.id },
            data: { balance: { decrement: amount } }
        });

        // 2. Log Transaction
        await this.prisma.specialFundLog.create({
            data: {
                amount,
                type: 'OUT',
                description: `Withdrawal to ${to} for ${purpose}`,
                timestamp: new Date(),
            }
        });

        // 3. Log to Main Audit Trail as well (so it appears in History)
        await this.logAction(userId, 'WITHDRAW_DANA_KHAS', `Withdrew RM${amount} to ${to}. Purpose: ${purpose}`);

        return { success: true, remainingBalance: fund.balance };
    }
}
