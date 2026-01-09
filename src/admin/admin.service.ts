
import { Injectable, NotFoundException, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { GoldService } from '../gold/gold.service';

@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
        private auditService: AuditService,
        private notificationService: NotificationService,
        @Inject(forwardRef(() => GoldService)) private goldService: GoldService
    ) { }

    async getPendingUsers() {
        return this.prisma.user.findMany({
            where: {
                isActive: false,
                role: 'USER' // Only regular users need approval? Or everyone?
            }
        });
    }

    async getAllUsers(query?: string) {
        // Return all users for Super Admin management, with optional search
        if (query) {
            const lowerQuery = query.toLowerCase();
            return this.prisma.user.findMany({
                where: {
                    OR: [
                        { fullName: { contains: query } }, // Case sensitivity depends on DB, usually robust enough or use mode: 'insensitive' if postgres
                        { email: { contains: query } },
                        { memberId: { contains: query } },
                        { phone: { contains: query } }
                    ]
                },
                orderBy: { createdAt: 'desc' }
            });
        }
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    async approveUser(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: { isActive: true }
        });

        // Notify User
        await this.notificationService.sendNotification(
            userId,
            'Tahniah! Akaun Anda Telah Diaktifkan',
            'Selamat datang ke Eeya Gold! Akaun anda telah berjaya disahkan. Sila lengkapkan profil dan KYC anda untuk mula berjual beli emas.',
            'SUCCESS'
        );

        // Log Audit
        await this.auditService.logAction('ADMIN', 'APPROVE_USER', `Approved user ${user.email}`, userId);
        return { success: true };
    }

    async updateUserRole(adminId: string, targetUserId: string, newRole: string) {
        // Validate Admin
        let admin;
        if (adminId === 'admin-id') {
            // Fallback for development/testing without real auth guard
            admin = await this.prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
        } else {
            admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        }

        if (!admin) throw new NotFoundException('Admin not found. Please re-login.');

        // Use real ID for audit log
        const performingAdminId = admin.id;

        // Validate Role
        const allowedRoles = ['USER', 'ADMIN', 'SUPER_ADMIN', 'ADMIN_AUDIT', 'ADMIN_SUPPORT'];
        if (!allowedRoles.includes(newRole)) {
            throw new NotFoundException('Invalid Role');
        }

        const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
        const targetName = targetUser ? targetUser.fullName : 'Unknown User';

        await this.prisma.user.update({
            where: { id: targetUserId },
            data: {
                role: newRole,
                isActive: true // Auto-approve if role is changed by admin
            }
        });

        // Log Audit
        await this.auditService.logAction(performingAdminId, 'UPDATE_ROLE', `Changed role for ${targetName} to ${newRole}`, targetUserId);
        return { success: true };
    }

    async updateAdminStatus(targetUserId: string, newStatus: string) {
        // Validate Status
        const allowedStatus = ['ACTIVE', 'ON_LEAVE'];
        if (!allowedStatus.includes(newStatus)) {
            throw new NotFoundException('Invalid Status');
        }

        await this.prisma.user.update({
            where: { id: targetUserId },
            data: { adminStatus: newStatus }
        });

        // Log Audit
        // Note: We might want headers/user info here later for performedBy
        await this.auditService.logAction('SUPER_ADMIN', 'UPDATE_STATUS', `Changed status to ${newStatus}`, targetUserId);
        return { success: true };
    }

    async updateUserStatus(adminId: string, targetUserId: string, status: string, reason: string) {
        // Validation
        const allowedStatus = ['ACTIVE', 'SUSPENDED', 'TERMINATED'];
        if (!allowedStatus.includes(status)) {
            throw new NotFoundException('Invalid Status');
        }

        // Get Admin Details for Audit
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin) throw new NotFoundException('Admin not found');

        // Check Permissions (Double check service layer)
        if (admin.role !== 'SUPER_ADMIN' && admin.role !== 'ADMIN_AUDIT') {
            throw new UnauthorizedException('Insufficient permissions');
        }

        // Update User
        // If Suspended/Terminated, set isActive = false to block login immediately
        const isActive = status === 'ACTIVE';

        await this.prisma.user.update({
            where: { id: targetUserId },
            data: {
                accountStatus: status,
                isActive: isActive
            }
        });

        // Log Audit
        await this.auditService.logAction(
            adminId,
            'UPDATE_ACCOUNT_STATUS',
            `Changed account status to ${status}. Reason: ${reason}`,
            targetUserId
        );

        return { success: true };
    }

    async sendBroadcast(adminId: string, title: string, body: string, targetType: 'ALL' | 'SPECIFIC', targetUserIds?: string[]) {
        // Validate Admin
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin) throw new UnauthorizedException('Admin not found');

        // Logic check
        let userIds: string[] = [];
        if (targetType === 'SPECIFIC') {
            if (!targetUserIds || targetUserIds.length === 0) {
                throw new NotFoundException('No target users specified');
            }
            userIds = targetUserIds;

            // Resolve logic: Check ID, Email, or MemberID
            const foundUsers = await this.prisma.user.findMany({
                where: {
                    OR: [
                        { id: { in: userIds } },
                        { email: { in: userIds } },
                        { memberId: { in: userIds } }
                    ]
                },
                select: { id: true, email: true, memberId: true }
            });

            const resolvedIds = foundUsers.map(u => u.id);

            if (resolvedIds.length !== userIds.length) {
                const foundSet = new Set([
                    ...foundUsers.map(u => u.id),
                    ...foundUsers.map(u => u.email),
                    ...foundUsers.map(u => u.memberId)
                ]);

                const missing = userIds.filter(input => !foundSet.has(input));
                if (missing.length > 0) {
                    throw new NotFoundException(`Users not found for: ${missing.join(', ')}`);
                }
            }

            userIds = resolvedIds;
        }

        // Send via Notification Service
        const result = await this.notificationService.sendBroadcast(title, body, userIds);

        // Audit Log
        const targetDesc = targetType === 'ALL' ? 'ALL USERS' : `${userIds.length} Specific Users`;
        await this.auditService.logAction(
            adminId,
            'BROADCAST',
            `Sent Broadcast "${title}" to ${targetDesc}. Count: ${result.count}`,
            'SYSTEM'
        );

        return { success: true, count: result.count };
    }

    async renewUserMembership(adminId: string, targetUserId: string) {

        // Delegate to GoldService
        const result = await this.goldService.processMembershipRenewal(targetUserId, adminId);
        return { success: true, newExpiry: result.newExpiry };
    }
}
