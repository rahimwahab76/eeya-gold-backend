import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ConfigService } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class CommissionService {
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
        private notificationService: NotificationService
    ) { }

    async processCommissions(transaction: any) {
        const user = await this.prisma.user.findUnique({
            where: { id: transaction.userId },
            include: { sponsor: true },
        });

        if (!user || user.sponsorId == null || !user.sponsor) {
            return; // No sponsor, no commission
        }

        const value = transaction.totalPrice; // RM value of purchase
        const sponsor = user.sponsor;

        await this.processReferralBonus(sponsor, user, transaction, value);
        await this.processPurchaseBonus(sponsor, user, transaction, value);
    }

    // Bonus 2: 0.5% Referral Commission (Sponsor Bonus)
    // Rule: Capped at RM3000 per Recruit (Lifetime Quota)
    // Rule: Auto-credited to E-Kredit
    private async processReferralBonus(sponsor: any, sourceUser: any, txn: any, value: number) {
        // 1. Get Configured Rate
        // Note: Default 0.5% (0.005)
        const rate = this.configService.getNumber('BONUS_SPONSOR_RATE', 0.005);
        if (rate <= 0) return;

        // 2. Check Quota (RM3000 limit from this specific downline)
        const quotaLimit = 3000.0; // Hardcoded rule or Config? Let's stick to rule for now.

        // Sum previous payouts from this recruit
        const totalPaidRes = await this.prisma.memberCommissionLedger.aggregate({
            _sum: { amountRM: true },
            where: {
                userId: sponsor.id,
                fromUserId: sourceUser.id,
                // We filter by note content or we need a specific TYPE field. 
                // Using 'note' contains 'Referral Bonus' is risky if string changes.
                // Best effort for now: We assume all commissions between these 2 in Ledger are referral? 
                // No, purchase bonus also exists.
                // We must differentiate. The previous code set note: `0.5% Referral Bonus`
                note: { contains: 'Referral Bonus' }
            }
        });

        const totalPaid = totalPaidRes._sum.amountRM || 0;

        if (totalPaid >= quotaLimit) return; // Quota exhausted

        // 3. Calculate Bonus
        let commission = value * rate;

        // 4. Cap Logic
        if (totalPaid + commission > quotaLimit) {
            commission = quotaLimit - totalPaid;
        }

        if (commission <= 0) return;

        // 5. Credit to Sponsor E-Kredit (CreditBalance)
        await this.prisma.wallet.update({
            where: { userId: sponsor.id },
            data: { creditBalance: { increment: commission } }, // Updated to E-Kredit
        });

        // 6. Update Global Stat (Optional, for analytics)
        await this.prisma.user.update({
            where: { id: sponsor.id },
            data: { totalReferralCommission: { increment: commission } },
        });

        // 7. Log to Ledger
        await this.prisma.memberCommissionLedger.create({
            data: {
                userId: sponsor.id,
                fromUserId: sourceUser.id,
                refSales: `GS-${txn.id.substring(0, 5)}`,
                month: new Date().toISOString().slice(0, 7),
                amountRM: commission,
                status: 'QUALIFIED',
                note: `${(rate * 100).toFixed(1)}% Referral Bonus` // Identifier string
            }
        });

        // 8. Notify Sponsor
        this.notificationService.sendNotification(
            sponsor.id,
            'Referral Bonus Received',
            `You received RM${commission.toFixed(2)} referral bonus from ${sourceUser.fullName}'s purchase.`,
            'MARKETING'
        );
    }

    // Bonus 3: 1% Purchase Commission (Downline Purchase Bonus)
    // Rule: 1.0% Rate (Configurable)
    // Rule: Requires 0.25g Personal Sales. Else -> Dana Khas
    private async processPurchaseBonus(sponsor: any, sourceUser: any, txn: any, value: number) {
        const rate = this.configService.getNumber('BONUS_DOWNLINE_PURCHASE_RATE', 0.01);
        if (rate <= 0) return;

        const commission = value * rate;

        // Maintenance Check: Must have Personal Sales >= Configured Min
        const minSales = this.configService.getNumber('MONTHLY_BONUS_MIN_GRAMS', 0.25);

        if (sponsor.currentMonthPersonalSales < minSales) {
            // NOT ELIGIBLE -> Divert to Dana Khas
            console.log(`Sponsor ${sponsor.fullName} not eligible (Sales < ${minSales}g). Diverting RM${commission} to Dana Khas.`);

            await this.prisma.specialFundLedger.create({
                data: {
                    month: new Date().toISOString().slice(0, 7),
                    source: 'UNQUALIFIED_BONUS',
                    inRM: commission,
                    outRM: 0,
                    balanceRM: commission
                }
            });

            // Record as UNQUALIFIED
            await this.prisma.memberCommissionLedger.create({
                data: {
                    userId: sponsor.id,
                    fromUserId: sourceUser.id,
                    refSales: `GS-${txn.id.substring(0, 5)}`,
                    month: new Date().toISOString().slice(0, 7),
                    amountRM: commission,
                    status: 'UNQUALIFIED',
                    note: `${(rate * 100).toFixed(1)}% Purchase Bonus (Sales < ${minSales}g)`
                }
            });
            return;
        }

        // ELIGIBLE -> Credit to Sponsor E-Kredit
        await this.prisma.wallet.update({
            where: { userId: sponsor.id },
            data: { creditBalance: { increment: commission } }, // Updated to E-Kredit
        });

        await this.prisma.memberCommissionLedger.create({
            data: {
                userId: sponsor.id,
                fromUserId: sourceUser.id,
                refSales: `GS-${txn.id.substring(0, 5)}`,
                month: new Date().toISOString().slice(0, 7),
                amountRM: commission,
                status: 'QUALIFIED',
                note: `${(rate * 100).toFixed(1)}% Purchase Bonus`
            },
        });

        // Notify Sponsor
        this.notificationService.sendNotification(
            sponsor.id,
            'Override Bonus Received',
            `You received RM${commission.toFixed(2)} override bonus from ${sourceUser.fullName}.`,
            'MARKETING'
        );
    }
}
