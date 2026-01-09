
import { Injectable, BadRequestException, OnModuleInit, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CommissionService } from '../commission/commission.service';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';

export interface GoldPrice {
    buy: number;
    sell: number;
    buy916: number;
    sell916: number;
    timestamp: Date;
}

@Injectable()
export class GoldService implements OnModuleInit {
    private readonly ANNUAL_FEE = 36.50;

    constructor(
        private prisma: PrismaService,
        private commissionService: CommissionService,
        private auditService: AuditService,
        private notificationService: NotificationService
    ) { }

    private checkMembership(user: any) {
        if (!user.membershipExpiryDate) return; // Allow legacy/new users without date (or handle differently based on policy - Assuming grace period or admin must set first?)
        // Wait, requirement: "Selagi tak buat bayaran... tidak boleh buat sebarang urusan".
        // If null, it means they haven't paid. So block if null?
        // Let's assume defaulting to block if null (strict).

        const now = new Date();
        const expiry = user.membershipExpiryDate ? new Date(user.membershipExpiryDate) : null;

        if (!expiry || expiry < now) {
            throw new BadRequestException(`Akaun tidak aktif. Sila jelaskan Yuran Tahunan RM${this.ANNUAL_FEE.toFixed(2)} untuk teruskan urusan.`);
        }
    }

    async processMembershipRenewal(userId: string, adminId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        // Logic: extend from current expiry if valid, or from NOW if expired/null
        const now = new Date();
        let currentExpiry = user.membershipExpiryDate ? new Date(user.membershipExpiryDate) : now;
        if (currentExpiry < now) currentExpiry = now; // Reset to now if already expired

        const newExpiry = new Date(currentExpiry);
        newExpiry.setFullYear(newExpiry.getFullYear() + 1);

        // Update User
        await this.prisma.user.update({
            where: { id: userId },
            data: { membershipExpiryDate: newExpiry }
        });

        // Log to Ledger
        await this.prisma.membershipFeeLedger.create({
            data: {
                userId,
                type: 'ANNUAL_FEE',
                amountRM: this.ANNUAL_FEE,
                date: new Date(),
            }
        });

        // Audit & Notify
        await this.auditService.logAction(adminId, 'RENEW_MEMBERSHIP', `Renewed for ${user.fullName} until ${newExpiry.toISOString()}`, userId);
        await this.notificationService.sendNotification(userId, 'Keahlian Diperbaharui', `Terima kasih! Keahlian anda aktif sehingga ${newExpiry.toLocaleDateString()}.`, 'SUCCESS');

        return { newExpiry };
    }

    private currentPrice: GoldPrice = {
        buy: 350.00,
        sell: 385.00,
        buy916: 340.00,
        sell916: 360.00,
        timestamp: new Date(),
    };

    async onModuleInit() {
        const latestLabel = await this.prisma.goldPrice.findFirst({
            orderBy: { timestamp: 'desc' },
        });
        if (latestLabel) {
            this.currentPrice = {
                buy: latestLabel.buy,
                sell: latestLabel.sell,
                buy916: latestLabel.buy916 ?? 0,
                sell916: latestLabel.sell916 ?? 0,
                timestamp: latestLabel.timestamp
            };
            console.log(`[GoldService] Loaded PRICE: GAP Buy=${this.currentPrice.buy} Sell=${this.currentPrice.sell}`);
        }
    }

    async getPrice() {
        const price = await this.prisma.goldPrice.findFirst({
            orderBy: { timestamp: 'desc' },
        });

        if (!price) {
            return {
                buy: 340.00,
                sell: 360.00,
                buy916: 325.00,
                sell916: 345.00,
                timestamp: new Date(),
                id: 'mock-id'
            };
        }
        return price;
    }

    async updatePriceFromSpot(spotPricePerGram: number) {
        // Fetch latest config if needed, or use defaults/service state
        // For now, we assume current spreads are stored/resumed. 
        // Ideally we should have a separate config table, but we stored spreads in GoldPrice row.
        // We look up the *last valid* spreads to persist them, or use defaults.
        const lastLabel = await this.prisma.goldPrice.findFirst({ orderBy: { timestamp: 'desc' } });
        const sellSpread = lastLabel?.sellSpread ?? 8.3;
        const buySpread = lastLabel?.buySpread ?? 5.0;

        // Input is already Per Gram from Scheduler
        // Calculate Sell (Markup)
        // Sell = Spot + (Spot * 8.3%)
        const sellPrice999 = spotPricePerGram + (spotPricePerGram * (sellSpread / 100));

        // Calculate Buy (Markdown)
        // Buy = Spot - (Spot * 5.0%)
        const buyPrice999 = spotPricePerGram - (spotPricePerGram * (buySpread / 100));

        // Calculate 916 (Shop Price)
        // 916 = Sell999 * 0.916
        const sellPrice916 = sellPrice999 * 0.916;
        const buyPrice916 = buyPrice999 * 0.916; // Just for reference

        const newPrice = await this.prisma.goldPrice.create({
            data: {
                spotPrice: spotPricePerGram,
                buy: buyPrice999,
                sell: sellPrice999,
                buy916: buyPrice916,
                sell916: sellPrice916,
                sellSpread,
                buySpread,
                timestamp: new Date(),
            }
        });

        this.currentPrice = {
            buy: newPrice.buy,
            sell: newPrice.sell,
            buy916: newPrice.buy916 ?? 0,
            sell916: newPrice.sell916 ?? 0,
            timestamp: newPrice.timestamp
        };
        console.log(`[GoldService] Auto-Updated: SpotMYR=${spotPricePerGram.toFixed(2)} | Sell999=${this.currentPrice.sell.toFixed(2)} (Spread ${sellSpread}%)`);
        return newPrice;
    }

    async updateConfig(sellSpread: number, buySpread: number) {
        // Trigger a fake update or just store the config. 
        // Since we store spreads in the log, we need to create a new log entry to "save" the new preference 
        // effectively forcing a recalculation with the *same* spot price if possible, or just mock it till next cron.

        const lastLabel = await this.prisma.goldPrice.findFirst({ orderBy: { timestamp: 'desc' } });
        const spotPricePerGram = lastLabel?.spotPrice ?? 300; // Use last known spot (already in Grams)

        // Re-run calculation with new spreads
        const sellPrice999 = spotPricePerGram + (spotPricePerGram * (sellSpread / 100));
        const buyPrice999 = spotPricePerGram - (spotPricePerGram * (buySpread / 100));
        const sellPrice916 = sellPrice999 * 0.916;
        const buyPrice916 = buyPrice999 * 0.916;

        const newPrice = await this.prisma.goldPrice.create({
            data: {
                spotPrice: spotPricePerGram,
                buy: buyPrice999,
                sell: sellPrice999,
                buy916: buyPrice916,
                sell916: sellPrice916,
                sellSpread,
                buySpread,
                timestamp: new Date(),
            }
        });

        this.currentPrice = {
            buy: newPrice.buy,
            sell: newPrice.sell,
            buy916: newPrice.buy916 ?? 0,
            sell916: newPrice.sell916 ?? 0,
            timestamp: newPrice.timestamp
        };
        return newPrice;
    }

    // Deprecated manual update, but kept for compatibility just in case
    async updatePrice(buy: number, sell: number, buy916: number, sell916: number) {
        // This acts as a manual override, setting spreads to 0 or implied
        this.currentPrice = { buy, sell, buy916, sell916, timestamp: new Date() };
        return this.prisma.goldPrice.create({
            data: {
                spotPrice: 0, // Manual Override
                buy,
                sell,
                buy916,
                sell916,
                sellSpread: 0,
                buySpread: 0,
                timestamp: new Date(),
            }
        });
    }

    async getCompanyStock() {
        const stock = await this.prisma.companyStock.findFirst();
        return {
            currentStockGram: stock ? stock.currentStockGram : 0.0,
        };
    }

    lockPrice() {
        const lockId = Math.random().toString(36).substring(7);
        const expiresAt = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes
        return {
            lockId,
            expiresAt,
            price: this.currentPrice,
        };
    }

    async buyGold(userId: string, gram: number, lockId: string): Promise<any> {
        // 0. CHECK COMPANY STOCK FIRST
        const stockCheck = await this.prisma.companyStock.findFirst();
        if (!stockCheck || stockCheck.currentStockGram < gram) {
            throw new BadRequestException('Harap maaf, stok emas syarikat tidak mencukupi buat masa ini.');
        }

        // 1. Fetch User and Wallet
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
            include: { user: true }
        });
        if (!wallet) throw new BadRequestException('Wallet not found for user');

        // 1.1 Check Membership
        this.checkMembership(wallet.user);

        // 2. Calculate Pricing
        const pricePerGram = this.currentPrice.buy;
        const totalCost = gram * pricePerGram;

        // 3. Calculate Rebate (2%)
        let rebateToUse = 0;
        let finalCost = totalCost;

        if (wallet.rebateBalance > 0) {
            const potentialRebate = totalCost * 0.02; // 2%
            rebateToUse = Math.min(potentialRebate, wallet.rebateBalance);
            finalCost = totalCost - rebateToUse;
        }

        // 4. Check Credit Balance
        console.log(`[BUY_GOLD_DEBUG] User: ${userId}`);
        console.log(`[BUY_GOLD_DEBUG] Wallet State -> Credit: ${wallet.creditBalance}, Rebate: ${wallet.rebateBalance}`);
        console.log(`[BUY_GOLD_DEBUG] Transaction -> Total: ${totalCost}, RebateDed: ${rebateToUse}, Final Bill: ${finalCost}`);

        if (wallet.creditBalance < finalCost) {
            console.error(`[BUY_GOLD_FAIL] Insufficient Balance. Required: ${finalCost}, Have: ${wallet.creditBalance}`);
            throw new BadRequestException({
                message: 'Insufficient e-Kredit',
                required: finalCost,
                available: wallet.creditBalance,
                shortfall: finalCost - wallet.creditBalance
            });
        }

        // 5. Execute DB Transaction
        const transaction = await this.prisma.$transaction(async (prisma: any) => {
            // Deduct Moneys
            await prisma.wallet.update({
                where: { userId },
                data: {
                    creditBalance: { decrement: finalCost },
                    rebateBalance: { decrement: rebateToUse },
                    goldBalance: { increment: gram },
                },
            });

            // Update Personal Sales for Bonus Eligibility
            await prisma.user.update({
                where: { id: userId },
                data: {
                    currentMonthPersonalSales: { increment: gram },
                    currentYearPersonalSales: { increment: gram },
                }
            });

            // Deduct Company Stock (Physical)
            // Re-fetch inside transaction to be atomic
            const stock = await prisma.companyStock.findFirst();
            if (stock) {
                if (stock.currentStockGram < gram) {
                    throw new Error('Stok emas syarikat tidak mencukupi.');
                }
                await prisma.companyStock.update({
                    where: { id: stock.id },
                    data: { currentStockGram: { decrement: gram } }
                });
            }

            // A. Record Gold Sales (Grand Ledger C)
            // Note: Cost is 0 for now as we don't track FIFO cost yet.
            const costRM = 0;
            await prisma.goldSalesLedger.create({
                data: {
                    userId,
                    weightGram: gram,
                    pricePerGram: pricePerGram,
                    totalRM: finalCost + rebateToUse, // Gross Revenue (ignoring rebate/discount logic for revenue? Usually Revenue = Price)
                    costRM: costRM,
                    grossProfit: (finalCost + rebateToUse) - costRM,
                    paymentMethod: 'E_CREDIT'
                }
            });

            // B. Record Member Gold Holding (Grand Ledger B)
            await prisma.memberGoldHoldingLedger.create({
                data: {
                    userId,
                    refNo: `BUY-GOLD`, // Will refine later
                    inGram: gram,
                    outGram: 0,
                    balanceGram: wallet.goldBalance + gram
                }
            });

            // C. Record Stock Out (Grand Ledger A)
            if (stock) {
                await prisma.goldStockMasterLedger.create({
                    data: {
                        refNo: `SALE-${userId.substring(0, 4)}`,
                        inGram: 0,
                        outGram: gram,
                        balanceGram: stock.currentStockGram - gram,
                        costRM: 0
                    }
                });
            }

            // Create Transaction Record (Legacy/Order History)
            return prisma.goldTransaction.create({
                data: {
                    userId,
                    type: 'BUY',
                    status: 'COMPLETED', // Auto-complete for now
                    gram,
                    pricePerGram,
                    totalPrice: finalCost,
                    discountAmount: rebateToUse,
                },
            });
        });

        // 6. Trigger Commission Engine (Async)
        this.commissionService.processCommissions(transaction).catch(err => console.error('Commission Error', err));

        // 7. Log to Audit Service (for Admin History)
        this.auditService.logAction(
            userId,
            'BUY_GOLD',
            `Bought ${gram}g Gold for RM${transaction.totalPrice.toFixed(2)} (Rebate: RM${transaction.discountAmount.toFixed(2)})`,
            userId // Target is self
        );

        // 8. Send Notification to User
        this.notificationService.sendNotification(
            userId,
            'Gold Purchase Successful',
            `You have successfully purchased ${gram}g of gold.`,
            'TRANSACTION'
        );

        return {
            success: true,
            transactionId: transaction.id,
            message: `Successfully bought ${gram}g gold. Paid RM${finalCost.toFixed(2)} (Rebate: RM${rebateToUse.toFixed(2)})`,
            timestamp: new Date(),
        };
    }

    async sellGold(userId: string, gram: number, lockId: string): Promise<any> {
        // 1. Fetch User and Wallet
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
            include: { user: true }
        });
        if (!wallet) throw new BadRequestException('Wallet not found');

        // 1.1 Check Membership
        this.checkMembership(wallet.user);

        // 2. Validate Balance
        if (wallet.goldBalance < gram) {
            throw new BadRequestException('Baki emas tidak mencukupi.');
        }

        // 3. Pricing
        // User Sell means We Buy. We Buy at 'buy' price.
        // Wait, 'buy' in my model is Eeya Buy Price (Low). 'sell' is Eeya Sell Price (High).
        // Standard GAP: 'Buy Price' = Bank Buy Price. 'Sell Price' = Bank Sell Price.
        // So User sets 'Selling'. Eeya is 'Buying'. Use `this.currentPrice.buy`.
        const pricePerGram = this.currentPrice.buy;
        // NOTE: Usually there's a spread.
        // If Model says 'buy' is usually lower than 'sell'.
        // Let's assume `this.currentPrice.buy` is the correct rate for User Selling back to us.

        const totalPayout = gram * pricePerGram;

        // 4. Transaction
        const transaction = await this.prisma.$transaction(async (prisma: any) => {
            // Deduct Gold, Add Cash
            await prisma.wallet.update({
                where: { userId },
                data: {
                    goldBalance: { decrement: gram },
                    creditBalance: { increment: totalPayout }
                }
            });

            // Add to Company Stock (Physical/Virtual)
            const stock = await prisma.companyStock.findFirst();
            if (stock) {
                await prisma.companyStock.update({
                    where: { id: stock.id },
                    data: { currentStockGram: { increment: gram } }
                });
            }

            // Record Transaction
            return prisma.goldTransaction.create({
                data: {
                    userId,
                    type: 'SELL',
                    status: 'COMPLETED',
                    gram,
                    pricePerGram,
                    totalPrice: totalPayout,
                }
            });
        });

        // 5. Notify
        await this.notificationService.sendNotification(
            userId,
            'Jualan Emas Berjaya',
            `Anda telah menjual ${gram}g emas dengan harga RM${totalPayout.toFixed(2)}.`,
            'TRANSACTION'
        );

        // 6. Audit
        await this.auditService.logAction(userId, 'SELL_GOLD', `Sold ${gram}g Gold for RM${totalPayout.toFixed(2)}`, userId);

        return {
            success: true,
            transactionId: transaction.id,
            message: `Successfully sold ${gram}g gold. Credit RM${totalPayout.toFixed(2)} received.`,
            timestamp: new Date(),
        };
    }

    async getWallet(userId: string) {
        console.log(`[DEBUG] Fetching Wallet for ${userId}`);
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        // Return zeros if no wallet found (for reliability)
        if (!wallet) {
            console.log(`[DEBUG] No wallet found for ${userId}, returning zeros.`);
            return { creditBalance: 0, rebateBalance: 0, bonusBalance: 0, goldBalance: 0 };
        }
        console.log(`[DEBUG] Wallet found: ${JSON.stringify(wallet)}`);
        return wallet;
    }

    async getTransactions(userId: string) {
        return this.prisma.goldTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getAllTransactions() {
        return this.prisma.goldTransaction.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { fullName: true, email: true } } }
        });
    }
}
