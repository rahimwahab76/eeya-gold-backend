import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Gold Price...');

    const price = await prisma.goldPrice.create({
        data: {
            buy: 385.00,
            sell: 350.00,
            buy916: 360.00,
            sell916: 340.00,
            timestamp: new Date()
        }
    });

    console.log('✅ Gold Price Seeded:', price);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
