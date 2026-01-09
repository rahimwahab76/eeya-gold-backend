
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

import { NotificationService } from '../notification/notification.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class KycService {
    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService,
        private auditService: AuditService
    ) { }

    async submitKyc(userId: string, data: { icImageUrl: string; selfieUrl: string }) {
        // Check if already approved
        const existing = await this.prisma.kycSubmission.findUnique({ where: { userId } });
        if (existing && existing.status === 'APPROVED') {
            throw new BadRequestException('KYC already approved. Cannot resubmit.');
        }

        // Create or Update Submission (Upsert)
        const submission = await this.prisma.kycSubmission.upsert({
            where: { userId },
            update: {
                icImageUrl: data.icImageUrl,
                selfieUrl: data.selfieUrl,
                status: 'PENDING', // Reset to PENDING if they resubmit
            },
            create: {
                userId,
                icImageUrl: data.icImageUrl,
                selfieUrl: data.selfieUrl,
                status: 'PENDING',
            }
        });

        // Update User Status
        await this.prisma.user.update({
            where: { id: userId },
            data: { kycStatus: 'PENDING' }
        });

        return submission;
    }

    async approveKyc(userId: string, adminId: string) {
        // Validate Admin
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin) throw new NotFoundException('Admin not found. Please re-login.');

        const submission = await this.prisma.kycSubmission.findUnique({ where: { userId } });
        if (!submission) throw new NotFoundException('KYC Submission not found');

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const userName = user ? user.fullName : 'Unknown User';

        if (submission.status === 'APPROVED') {
            throw new BadRequestException('KYC already approved.');
        }

        // 1. Update KYC Status
        await this.prisma.kycSubmission.update({
            where: { userId },
            data: {
                status: 'APPROVED',
                reviewedAt: new Date(),
                reviewedBy: 'ADMIN' // In real app, get from Context
            }
        });

        await this.prisma.user.update({
            where: { id: userId },
            data: { kycStatus: 'APPROVED' }
        });

        // 2. BONUS TRIGGER: Credit RM300 e-Rebate
        let wallet = await this.prisma.wallet.findUnique({ where: { userId } });

        if (!wallet) {
            // Create wallet with bonus if it doesn't exist (Legacy user fix)
            wallet = await this.prisma.wallet.create({
                data: {
                    userId,
                    rebateBalance: 300.0,
                    creditBalance: 0.0,
                    bonusBalance: 0.0,
                    goldBalance: 0.0
                }
            });
            console.log(`[BONUS] Created Wallet and Credited RM300 to User ${userId}`);
        } else if (wallet.rebateBalance === 0) {
            await this.prisma.wallet.update({
                where: { userId },
                data: { rebateBalance: 300.0 }
            });
            console.log(`[BONUS] Credited RM300 to User ${userId}`);
        } else {
            console.log(`[BONUS] Skipped. User ${userId} already has ${wallet.rebateBalance}`);
        }

        // Log Audit
        await this.auditService.logAction(adminId, 'APPROVE_KYC', `Approved KYC for ${userName}`, userId);

        // Notify User
        await this.notificationService.sendNotification(
            userId,
            'Tahniah! KYC Anda Telah Diluluskan',
            'Tahniah, anda berjaya menebus e-Rebat RM300! Sila tambah nilai ke akaun e-Kredit untuk mula menabung emas.',
            'SUCCESS'
        );

        return { message: 'KYC Approved and Bonus Credited' };
    }

    async rejectKyc(userId: string, adminId: string, reason: string) {
        // Validate Admin
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin) throw new NotFoundException('Admin not found. Please re-login.');

        const submission = await this.prisma.kycSubmission.findUnique({ where: { userId } });
        if (!submission) throw new NotFoundException('KYC Submission not found');

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const userName = user ? user.fullName : 'Unknown User';

        // Update KYC Status to REJECTED
        await this.prisma.kycSubmission.update({
            where: { userId },
            data: {
                status: 'REJECTED',
                reviewedAt: new Date(),
                reviewedBy: 'ADMIN',
                rejectionReason: reason
            }
        });

        // Update User Status
        await this.prisma.user.update({
            where: { id: userId },
            data: { kycStatus: 'REJECTED' }
        });

        // Send Notification
        await this.notificationService.sendNotification(
            userId,
            'Permohonan KYC Ditolak',
            `Harap maaf, permohonan KYC anda tidak berjaya. Sebab: ${reason}. Sila cuba lagi.`,
            'ERROR'
        );

        // Log Audit
        await this.auditService.logAction(adminId, 'REJECT_KYC', `Rejected KYC for ${userName}. Reason: ${reason}`, userId);

        return { message: 'KYC Rejected' };
    }

    async getKycStatus(userId: string) {
        const submission = await this.prisma.kycSubmission.findUnique({ where: { userId } });
        if (!submission) {
            return { status: 'UNVERIFIED' };
        }
        return submission; // Returns id, status, rejectionReason, etc.
    }

    async getPendingKyc() {
        return this.prisma.kycSubmission.findMany({
            where: { status: 'PENDING' },
            include: { user: true }
        });
    }
}
