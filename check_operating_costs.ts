import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const costs = await prisma.operatingCostLedger.findMany();
    console.log('Operating Costs Count:', costs.length);
    console.log('Operating Costs Data:', JSON.stringify(costs, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
