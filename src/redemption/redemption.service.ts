
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class RedemptionService {
    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService
    ) { }

    async getPendingRequests() {
        return this.prisma.redemptionRequest.findMany({
            where: { status: 'PENDING' },
            include: { user: { select: { fullName: true, email: true, phone: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getUserRequests(userId: string) {
        return this.prisma.redemptionRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getAllRequests() {
        return this.prisma.redemptionRequest.findMany({
            include: { user: { select: { fullName: true, email: true, phone: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }

    async requestRedemption(userId: string, grams: number, shippingAddress: string) {
        if (grams < 1) throw new BadRequestException('Minimum redemption is 1g');

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { wallet: true }
        });

        if (!user || !user.wallet) throw new NotFoundException('User not found');

        // 1. Check Gold Balance
        if (user.wallet.goldBalance < grams) {
            throw new BadRequestException('Insufficient gold balance');
        }

        // 2. Calculate Fees (Mock Logic)
        // RM10 Shipping + RM50/g Upah (Labor)
        const shippingFee = 10;
        const laborFee = grams * 50;
        const totalFee = shippingFee + laborFee;

        // 3. Check Credit Balance
        if (user.wallet.creditBalance < totalFee) {
            throw new BadRequestException(`Insufficient E-Credit. Need RM${totalFee} (Fees) but have RM${user.wallet.creditBalance}. Please Top-up.`);
        }

        // 4. Process Deduction & Create Request
        // 4. Process Deduction & Create Request
        await this.prisma.$transaction([
            // Deduct Gold
            this.prisma.wallet.update({
                where: { userId },
                data: {
                    goldBalance: { decrement: grams },
                    creditBalance: { decrement: totalFee }
                }
            }),
            // Create Request
            this.prisma.redemptionRequest.create({
                data: {
                    userId,
                    grams,
                    shippingAddress,
                    feeAmount: totalFee,
                    status: 'PENDING'
                }
            }),
            // NEW: Record in MemberGoldHoldingLedger (Grand Ledger B)
            this.prisma.memberGoldHoldingLedger.create({
                data: {
                    userId,
                    refNo: "REDEEM-PENDING",
                    inGram: 0,
                    outGram: grams,
                    balanceGram: user.wallet.goldBalance - grams // Approximate
                }
            })
        ]);

        // 5. Notify
        await this.notificationService.sendNotification(
            userId,
            'Gold Redemption Request Received',
            `Your request for ${grams}g gold has been received. Fees deducted: RM${totalFee}. Waiting for shipment.`,
            'INFO'
        );

        // 6. Audit
        await this.prisma.auditLog.create({
            data: {
                action: 'REDEMPTION_REQUEST',
                performedBy: userId,
                details: `Requested ${grams}g gold. Fees Paid: RM${totalFee}`,
                timestamp: new Date()
            }
        });

        return { success: true, message: 'Redemption requested successfully' };
    }

    async approveRedemption(requestId: string, adminId: string) {
        const req = await this.prisma.redemptionRequest.findUnique({ where: { id: requestId } });
        if (!req) throw new NotFoundException('Request not found');

        if (req.status !== 'PENDING') {
            throw new BadRequestException('Request is not PENDING');
        }

        await this.prisma.$transaction([
            // 1. Update Status
            this.prisma.redemptionRequest.update({
                where: { id: requestId },
                data: { status: 'APPROVED' }
            }),
            // 2. Credit Admin Ledger (Fee)
            // 2. Credit PostageHandlingLedger (Grand Ledger E - assuming Fees contain Postage/Handling)
            this.prisma.postageHandlingLedger.create({
                data: {
                    userId: req.userId,
                    ref: `REDEEM-${requestId.substring(0, 8)}`,
                    amountRM: req.feeAmount,
                    // date default now
                }
            }),
            // 3. Audit
            this.prisma.auditLog.create({
                data: {
                    action: 'REDEMPTION_APPROVED',
                    performedBy: adminId,
                    targetUser: req.userId,
                    details: `Approved redemption #${requestId}. Fee RM${req.feeAmount} credited to Admin Ledger.`
                }
            })
        ]);

        // Notify User
        await this.notificationService.sendNotification(
            req.userId,
            'Redemption Approved',
            'Your redemption request has been approved and is moving to packaging.',
            'SUCCESS'
        );

        return { success: true };
    }

    async markAsPackaging(requestId: string, adminId: string) {
        const req = await this.prisma.redemptionRequest.findUnique({ where: { id: requestId } });
        if (!req) throw new NotFoundException('Request not found');

        // Allow transition from APPROVED
        // if (req.status !== 'APPROVED') ... (Optional strict check)

        await this.prisma.redemptionRequest.update({
            where: { id: requestId },
            data: { status: 'PACKAGING' }
        });

        await this.notificationService.sendNotification(
            req.userId,
            'Sedang Dibungkus',
            'Emas anda sedang dalam proses pembungkusan untuk penghantaran.',
            'INFO'
        );

        // Audit
        await this.prisma.auditLog.create({
            data: {
                action: 'REDEMPTION_PACKAGING',
                performedBy: adminId,
                targetUser: req.userId,
                details: `Marked redemption #${requestId} as PACKAGING (Printed).`
            }
        });

        return { success: true };
    }

    async updateTracking(requestId: string, trackingNumber: string, adminId: string) {
        const req = await this.prisma.redemptionRequest.findUnique({ where: { id: requestId } });
        if (!req) throw new NotFoundException('Request not found');

        // Deduct from Company Stock (Physical Stock Out)
        const stock = await this.prisma.companyStock.findFirst();
        if (stock) {
            await this.prisma.companyStock.update({
                where: { id: stock.id },
                data: {
                    currentStockGram: { decrement: req.grams }
                }
            });

            // NEW: Record in GoldStockMasterLedger (Grand Ledger A)
            await this.prisma.goldStockMasterLedger.create({
                data: {
                    refNo: `REDEEM-SHIP-${requestId.substring(0, 8)}`,
                    inGram: 0,
                    outGram: req.grams,
                    balanceGram: stock.currentStockGram - req.grams, // Snapshot
                    costRM: 0 // Optional: Calculate cost based on Avg Cost if needed
                }
            });
        }

        await this.prisma.redemptionRequest.update({
            where: { id: requestId },
            data: {
                status: 'SHIPPED',
                trackingNumber
            }
        });

        await this.notificationService.sendNotification(
            req.userId,
            'Telah Dihantar',
            `Emas anda (${req.grams}g) telah dihantar. Tracking No: ${trackingNumber}`,
            'SUCCESS'
        );

        // Log Audit
        await this.prisma.auditLog.create({
            data: {
                action: 'REDEMPTION_SHIPPED',
                performedBy: adminId,
                targetUser: req.userId,
                details: `Marked redemption ${requestId} as SHIPPED. Tracking: ${trackingNumber}. Deducted ${req.grams}g from Company Stock.`,
            }
        });

        return { success: true };
    }
}
