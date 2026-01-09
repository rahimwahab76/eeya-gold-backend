import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@eeyagold.com';

    console.log(`Looking for user: ${email}...`);
    const user = await prisma.user.findUnique({
        where: { email },
        include: { wallet: true },
    });

    if (!user) {
        console.error('User not found!');
        process.exit(1);
    }

    console.log(`Current Balance: RM${user.wallet?.creditBalance}`);

    const updated = await prisma.wallet.update({
        where: { userId: user.id },
        data: {
            creditBalance: { increment: 10000 },
        },
    });

    console.log(`✅ Top-up Successful! New Balance: RM${updated.creditBalance}`);

    // Optional: Create a Ledger entry for this manual top-up so it appears in history
    await prisma.eKreditLedger.create({
        data: {
            userId: user.id,
            refNo: `TOPUP-MANUAL-${Date.now()}`,
            inRM: 10000,
            outRM: 0,
            balanceRM: updated.creditBalance,
        }
    });
    console.log('✅ Ledger Entry Created.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
