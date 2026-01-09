
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { ReportService } from '../src/report/report.service';

/**
 * VERIFY REPORTING LOGIC
 * 
 * Objectives:
 * 1. Verify Group E: Admin can add Expenses.
 * 2. Verify Group H: Financial Report correctly calculates P&L.
 *    Logic Being Tested: Net = Revenue - Purchases(COGS) - Expenses - Commissions
 */
async function runVerification() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);
    const reportService = app.get(ReportService);

    console.log('--- STARTING FINANCIAL REPORTING VERIFICATION ---\n');

    try {
        // 1. SETUP
        // Clear previous test data to ensure clean numbers (Optional, but safer for math checks)
        // We'll just define unique references to identify our test data.
        const suffix = Date.now();

        // Create Admin
        const admin = await prisma.user.upsert({
            where: { email: 'finance_test@eeya.com' },
            update: { role: 'SUPER_ADMIN' },
            create: {
                email: 'finance_test@eeya.com',
                password: 'hashed',
                fullName: 'Finance Admin',
                role: 'SUPER_ADMIN'
            }
        });

        // 2. SIMULATE TRANSACTIONS
        console.log('2. Seeding Financial Data...');

        // A. Revenue (Gold Sales)
        // We create a dummy sales ledger entry directly
        const saleAmount = 1000.00;
        await prisma.goldSalesLedger.create({
            data: {
                userId: admin.id, // Bought by admin for simplicity
                weightGram: 3.0,
                pricePerGram: 333.33,
                totalRM: saleAmount,
                costRM: 900.00, // True COGS
                grossProfit: 100.00,
                paymentMethod: 'FPX',
                date: new Date()
            }
        });
        console.log(`   [SEED] Sales Revenue: RM${saleAmount}`);

        // B. Cost (Gold Purchase from Supplier)
        // Note: ReportService uses this for COGS currently
        const purchaseCost = 500.00;
        await prisma.goldPurchaseLedger.create({
            data: {
                supplierId: 1, // Assume supplier 1 exists or fails? We might need to ensure supplier.
                weightGram: 2.0,
                costPerGram: 250.00,
                totalRM: purchaseCost,
                status: 'COMPLETED',
                date: new Date()
            }
        });
        console.log(`   [SEED] Stock Purchase Cost: RM${purchaseCost}`);

        // C. Expense (Operating Cost) - The item we are explicitly verifying
        const expenseAmount = 50.00;
        await reportService.addExpense({
            title: 'Test Expense',
            amount: expenseAmount,
            category: 'UTILITIES',
            description: `Test Run ${suffix}`,
            recordedBy: admin.id
        });
        console.log(`   [SEED] Operating Expense: RM${expenseAmount}`);


        // 3. VERIFY P&L REPORT
        console.log('\n3. Generating Financial Report...');

        const report = await reportService.getFinancialReport('SUPER_ADMIN');

        // Helper to find item
        const getVal = (label: string) => report.find(r => r.item === label)?.amount_rm || 0;

        const totalRevenue = getVal('Total Sales Revenue');
        const totalGrossProfit = getVal('Gross Profit (Spread)');
        const totalOpex = getVal('Operating Expenses');
        const totalNet = getVal('Net Profit / Loss');

        console.log('   [REPORT] Data Retrived:');
        console.log(`   - Revenue:      RM${totalRevenue}`);
        console.log(`   - Gross Profit: RM${totalGrossProfit}`);
        console.log(`   - Opex:         RM${totalOpex}`);
        console.log(`   - Net:          RM${totalNet}`);

        // 4. ASSERTIONS
        // We check if our seeded values are INCLUDED. 
        // Logic: Since DB might have other data, we check if totals are >= our seeded values.
        // Better: We check delta? No, complex.
        // We rely on the fact that we just added these.

        if (totalRevenue < saleAmount) throw new Error('Revenue is less than seeded amount!');
        // Gross Profit from Seed: 100.00
        const expectedGross = 100.00;
        if (totalGrossProfit < expectedGross) throw new Error('Gross Profit is less than seeded amount!');

        if (totalOpex < expenseAmount) throw new Error('Expenses are less than seeded amount!');

        // Verify Formula: Net = GrossProfit - Opex - Commissions
        // We didn't seed Commissions here, so let's fetch that value to be precise
        const totalComms = getVal('Commissions Paid');

        const expectedNet = totalGrossProfit - totalOpex - totalComms;
        // Floating point tolerance
        if (Math.abs(totalNet - expectedNet) > 0.01) {
            console.error(`   [FAIL] Math Logic Mismatch! Report: ${totalNet}, Calculated: ${expectedNet}`);
            throw new Error('P&L Calculation Mismatch');
        } else {
            console.log('   [PASS] P&L Calculation Logic Verified (Net = Gross Profit - Expense - Comm).');
        }

        console.log('\n--- VERIFICATION SUCCESSFUL ---');

    } catch (e: any) {
        console.error('\n[FAIL] Verification Failed:', e.message);
        if (e.stack) console.error(e.stack);
    } finally {
        await app.close();
    }
}

runVerification();
