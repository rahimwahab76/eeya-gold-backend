import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@eeyagold.com';
    const password = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            password,
            memberId: 'EG0001',
            fullName: 'Super Admin',
            role: 'SUPER_ADMIN',
            isActive: true,
            wallet: {
                create: {
                    creditBalance: 10000,
                    goldBalance: 50,
                },
            },
            // Create mock Profile info to satisfy schema if needed
            phone: '0123456789',
            address: 'Gold HQ',
        },
    });

    // Seed Products
    const product1 = await prisma.product.create({
        data: {
            name: 'Cincin Emas Pulut Dakap',
            description: 'Cincin emas 916 design klasik.',
            price: 1250.00,
            weight: 3.5,
            purity: '916',
            imageUrl: 'https://via.placeholder.com/150',
            status: 'APPROVED',
            createdBy: admin.id,
        }
    });

    const product2 = await prisma.product.create({
        data: {
            name: 'Gelang Tangan Coco',
            description: 'Gelang tangan padu, design viral.',
            price: 3500.00,
            weight: 10.2,
            purity: '916',
            imageUrl: 'https://via.placeholder.com/150',
            status: 'APPROVED',
            createdBy: admin.id,
        }
    });

    // Seed Special Fund
    await prisma.specialFund.upsert({
        where: { id: 'fund-1' },
        update: {},
        create: {
            id: 'fund-1',
            balance: 5000.0,
        }
    });

    // Seed Company Stock
    const stock = await prisma.companyStock.findFirst();
    if (!stock) {
        await prisma.companyStock.create({
            data: {
                currentStockGram: 1000.0,
            }
        });
    }

    // Seed Supplier (Required for GoldPurchaseLedger)
    const supplier = await prisma.supplier.upsert({
        where: { supplierId: 1 },
        update: {},
        create: {
            name: 'Pemberani Gold Supplies',
            contactInfo: '012-3456789',
        },
    });

    // --- Group A: Pemerolehan & Stok ---
    // 1. Gold Purchase Ledger
    await prisma.goldPurchaseLedger.create({
        data: {
            supplierId: supplier.supplierId,
            weightGram: 1000.0,
            costPerGram: 280.0,
            totalRM: 280000.0,
            status: 'COMPLETED',
        },
    });

    // 2. Gold Stock Master Ledger
    await prisma.goldStockMasterLedger.create({
        data: {
            refNo: 'STK-IN-001',
            inGram: 1000.0,
            outGram: 0.0,
            balanceGram: 1000.0,
            costRM: 280000.0,
        },
    });

    // --- Group B: Pegangan Emas Ahli ---
    // 3. Member Gold Holding Ledger
    await prisma.memberGoldHoldingLedger.create({
        data: {
            userId: admin.id,
            refNo: 'HOLD-001',
            inGram: 50.0,
            outGram: 0.0,
            balanceGram: 50.0,
        },
    });

    // --- Group C: Jualan & Imbuhan ---
    // 4. Gold Sales Ledger
    await prisma.goldSalesLedger.create({
        data: {
            userId: admin.id,
            weightGram: 10.0,
            pricePerGram: 350.0,
            totalRM: 3500.0,
            costRM: 2800.0,
            grossProfit: 700.0,
            paymentMethod: 'FPX',
        },
    });

    // 5. Member Commission Ledger
    await prisma.memberCommissionLedger.create({
        data: {
            userId: admin.id,
            month: '2023-10',
            amountRM: 150.0,
            status: 'PAID',
            note: 'Bonus Referral',
        },
    });

    // --- Group D: Akaun Dalaman Ahli ---
    // 6. E-Kredit Ledger
    await prisma.eKreditLedger.create({
        data: {
            userId: admin.id,
            refNo: 'TOPUP-001',
            inRM: 500.0,
            outRM: 0.0,
            balanceRM: 500.0,
        },
    });

    // 7. E-Bonus Ledger
    await prisma.eBonusLedger.create({
        data: {
            userId: admin.id,
            month: '2023-10',
            amountRM: 200.0,
            status: 'CREDITED',
        },
    });

    // 8. E-Rebate Ledger
    await prisma.eRebateLedger.create({
        data: {
            userId: admin.id,
            amountRM: 50.0,
            status: 'CREDITED',
        },
    });

    // 9. Internal Transfer Ledger
    await prisma.internalTransferLedger.create({
        data: {
            userId: admin.id,
            fromAccount: 'E-BONUS',
            toAccount: 'E-KREDIT',
            amountRM: 100.0,
            status: 'COMPLETED',
        },
    });

    // --- Group E: Yuran & Dana Khas ---
    // 10. Membership Fee Ledger
    await prisma.membershipFeeLedger.create({
        data: {
            userId: admin.id,
            type: 'REGISTRATION',
            amountRM: 100.0,
        },
    });

    // 11. Storage Fee Ledger
    await prisma.storageFeeLedger.create({
        data: {
            userId: admin.id,
            duration: '12 Months',
            amountRM: 120.0,
        },
    });

    // 12. Postage & Handling Ledger
    await prisma.postageHandlingLedger.create({
        data: {
            userId: admin.id,
            ref: 'SHIP-001',
            amountRM: 15.0,
        },
    });

    // 12. Operating Cost Ledger
    await prisma.operatingCostLedger.create({
        data: {
            date: new Date(),
            category: 'Server Maintenance',
            amountRM: 350.0,
        },
    });

    await prisma.operatingCostLedger.create({
        data: {
            date: new Date(),
            category: 'Gaji Staff',
            amountRM: 3500.0,
        },
    });

    await prisma.operatingCostLedger.create({
        data: {
            date: new Date(),
            category: 'Marketing FB Ads',
            amountRM: 1500.0,
        },
    });

    // 13. Postage & Handling Ledger
    await prisma.specialFundLedger.create({
        data: {
            month: '2023-10',
            source: 'SALES_DEDUCTION',
            inRM: 5000.0,
            outRM: 0.0,
            balanceRM: 5000.0,
        },
    });

    // --- Group F: Ekuiti & Pelarasan ---
    // 15. Equity Ledger
    await prisma.equityRetainedEarningsLedger.create({
        data: {
            initialCapital: 1000000.0,
            netProfit: 50000.0,
            dividend: 0.0,
            balance: 1050000.0,
        },
    });

    // --- Group G: Adjustment & Snapshot ---
    // 16. Stock Adjustment Ledger
    await prisma.stockAdjustmentLedger.create({
        data: {
            refStock: 'ADJ-001',
            type: 'Audit Loss',
            gram: -0.5,
            note: 'Found missing during audit',
        },
    });

    // 17. Exception Log Ledger
    await prisma.exceptionLogLedger.create({
        data: {
            type: 'System Error',
            note: 'Test Exception Log',
            status: 'RESOLVED',
            userId: admin.id,
            refNo: 'ERR-001',
        },
    });

    // 18. Monthly Snapshot Ledger
    await prisma.monthlySnapshotLedger.create({
        data: {
            month: '2023-09',
            physicalStock: 1560.0,
            memberStock: 450.0,
            totalEKredit: 5000.25,
            totalEBonus: 1200.0,
            totalDanaKhas: 8500.0,
        },
    });

    console.log('Seeding completed for all ledgers (Group A-G).');
    await prisma.$disconnect();
}


main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
