import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ConfigService } from '../config/config.service';

@Injectable()
export class BonusService {
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService
    ) { }

    // --- MONTHLY CLOSING ---
    async runMonthlyClosing(month: string, adminId: string) {
        console.log(`[BONUS] Running Monthly Closing for ${month} by Admin ${adminId}`);
        const allUsers = await this.prisma.user.findMany({
            where: { role: 'USER', isActive: true },
            include: { downlines: true } // Basic include, realistic app might need recursive CTE
        });

        let totalProcessed = 0;
        let totalPaid = 0;
        let totalDanaKhas = 0;

        // 0. Prepare Configs
        const minSales = this.configService.getNumber('MONTHLY_BONUS_MIN_GRAMS', 0.25);

        const tier1Threshold = this.configService.getNumber('BONUS_TIER_1_THRESHOLD', 10000);
        const tier1Rate = this.configService.getNumber('BONUS_TIER_1_RATE', 0.0025);

        const tier2Threshold = this.configService.getNumber('BONUS_TIER_2_THRESHOLD', 50000);
        const tier2Rate = this.configService.getNumber('BONUS_TIER_2_RATE', 0.005);

        const tier3Threshold = this.configService.getNumber('BONUS_TIER_3_THRESHOLD', 100000);
        const tier3Rate = this.configService.getNumber('BONUS_TIER_3_RATE', 0.01);

        for (const user of allUsers) {
            // 1. Calculate Group Sales
            const groupSales = await this.calculateGroupSales(user.id, month);

            if (groupSales <= 0) continue;

            // 2. Determine Tier (Dynamic)
            let rate = 0;
            if (groupSales >= tier3Threshold) rate = tier3Rate;
            else if (groupSales >= tier2Threshold) rate = tier2Rate;
            else if (groupSales >= tier1Threshold) rate = tier1Rate;

            if (rate > 0) {
                const potentialBonus = groupSales * rate;

                // 3. Check Eligibility
                // Assumption: currentMonthPersonalSales is accurate
                const personalSales = user.currentMonthPersonalSales || 0;

                if (personalSales >= minSales) {
                    // QUALIFIED -> Pay to Wallet (E-Kredit)
                    await this.prisma.wallet.update({
                        where: { userId: user.id },
                        data: { creditBalance: { increment: potentialBonus } } // E-Kredit
                    });

                    await this.prisma.eBonusLedger.create({
                        data: {
                            userId: user.id,
                            month,
                            amountRM: potentialBonus,
                            status: 'QUALIFIED'
                        }
                    });
                    totalPaid += potentialBonus;
                } else {
                    // UNQUALIFIED -> Dana Khas
                    await this.prisma.specialFundLedger.create({
                        data: {
                            month,
                            source: `UNQ_MONTHLY_${user.memberId}`,
                            inRM: potentialBonus,
                            outRM: 0,
                            balanceRM: potentialBonus
                        }
                    });

                    await this.prisma.eBonusLedger.create({
                        data: {
                            userId: user.id,
                            month,
                            amountRM: potentialBonus,
                            status: 'UNQUALIFIED'
                        }
                    });
                    totalDanaKhas += potentialBonus;
                }
                totalProcessed++;
            }
        }

        // Reset Monthly Personal Sales for all users after closing
        // WARNING: Only do this if we are sure the month is over.
        // For manual trigger, maybe independent reset? Or implicit?
        // Let's reset for now as part of "Closing".
        await this.prisma.user.updateMany({
            data: { currentMonthPersonalSales: 0 }
        });

        return {
            processed: totalProcessed,
            totalPaid,
            totalDanaKhas,
            message: `Monthly Closing Complete. Paid RM${totalPaid}, Dana Khas RM${totalDanaKhas}`
        };
    }

    // --- YEARLY CLOSING ---
    async runYearlyClosing(year: string, adminId: string) {
        console.log(`[BONUS] Running Yearly Closing for ${year} by Admin ${adminId}`);
        const allUsers = await this.prisma.user.findMany({ where: { role: 'USER', isActive: true } });

        // Configs
        const minSalesGram = this.configService.getNumber('YEARLY_BONUS_MIN_GRAMS', 3.0);
        const yearlyRate = this.configService.getNumber('BONUS_YEARLY_RATE', 0.01);

        let totalProcessed = 0;
        let totalPaid = 0;
        let totalDanaKhas = 0;

        // Date Range for the Year
        const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

        for (const user of allUsers) {
            // 1. Calculate Group Sales for the Year (Downline Only)
            // Note: We use variable 'totalPurchaseRM' to maintain compatibility with downstream checks,
            // but this value NOW represents GROUP SALES (Downlines), not Personal.
            const totalPurchaseRM = await this.calculateGroupSales(user.id, year, true);

            if (totalPurchaseRM <= 0) continue;

            const potentialBonus = totalPurchaseRM * yearlyRate;

            // 2. Check Eligibility (Personal Sales Grams >= 3.0g)
            const personalSalesGram = user.currentYearPersonalSales || 0;

            if (personalSalesGram >= minSalesGram) {
                // QUALIFIED -> Pay to E-Kredit
                await this.prisma.wallet.update({
                    where: { userId: user.id },
                    data: { creditBalance: { increment: potentialBonus } }
                });

                await this.prisma.eBonusLedger.create({
                    data: {
                        userId: user.id,
                        month: `${year}-YEARLY`,
                        amountRM: potentialBonus,
                        status: 'QUALIFIED'
                    }
                });
                totalPaid += potentialBonus;
            } else {
                // UNQUALIFIED -> Dana Khas
                await this.prisma.specialFundLedger.create({
                    data: {
                        month: `${year}-YEARLY`,
                        source: `UNQ_YEARLY_${user.memberId}`,
                        inRM: potentialBonus,
                        outRM: 0,
                        balanceRM: potentialBonus
                    }
                });
                await this.prisma.eBonusLedger.create({
                    data: {
                        userId: user.id,
                        month: `${year}-YEARLY`,
                        amountRM: potentialBonus,
                        status: 'UNQUALIFIED'
                    }
                });
                totalDanaKhas += potentialBonus;
            }
            totalProcessed++;
        }

        // Reset Yearly Personal Sales
        await this.prisma.user.updateMany({
            data: { currentYearPersonalSales: 0 }
        });

        return {
            processed: totalProcessed,
            totalPaid,
            totalDanaKhas,
            message: `Yearly Closing Complete. Paid RM${totalPaid}, Dana Khas RM${totalDanaKhas}`
        };
    }

    // --- HELPERS ---

    // Recursive Group Sales Calculation
    // Note: This is computationally expensive for large trees.
    // Optimization: Store 'path' or 'hierarchy' in DB.
    private async calculateGroupSales(userId: string, period: string, isYearly = false): Promise<number> {
        // 1. Get Direct Sales of User (Usually Personal Sales count towards Group? 
        // Requirements say "Jualan Kumpulan", usually implies Downlines. 
        // Standard Network Mkt: Group Sales = Personal + Downlines.

        let totalRM = 0;

        // Get Sales from Ledger for accuracy
        // Filter by Date
        const startDate = isYearly ? new Date(`${period}-01-01`) : new Date(`${period}-01`);
        const endDate = isYearly ? new Date(`${parseInt(period) + 1}-01-01`) : new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

        // Fetch user structure deep
        // We can't do recursive Prisma easily. 
        // Strategy: Get All Users, build tree in memory, sum.
        // For MVP/Proto with specific user ID, let's just do a focused raw query or 
        // sum downlines iteratively.
        // SIMPLIFIED MVP: Just sum direct downlines sales for now to demonstrate logic.
        // TO-DO: Implement Full Recursive Sum.

        // Let's implement a 3-level deep sum for now to be safe.
        return this.getDeepSales(userId, startDate, endDate, 3);
    }

    private async getDeepSales(userId: string, start: Date, end: Date, depth: number): Promise<number> {
        if (depth <= 0) return 0;

        const downlines = await this.prisma.user.findMany({ where: { sponsorId: userId } });
        let sum = 0;

        for (const dl of downlines) {
            // Get DL's sales
            const sales = await this.prisma.goldSalesLedger.aggregate({
                _sum: { totalRM: true },
                where: {
                    userId: dl.id,
                    date: { gte: start, lte: end }
                }
            });
            sum += (sales._sum.totalRM || 0);

            // Recurse
            sum += await this.getDeepSales(dl.id, start, end, depth - 1);
        }
        return sum;
    }
}
