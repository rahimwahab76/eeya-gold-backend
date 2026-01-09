import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking ProductOrders...');
    const orders = await prisma.productOrder.findMany({
        include: { user: true, product: true }
    });

    console.log(`Found ${orders.length} orders.`);
    orders.forEach(o => {
        console.log(`- Order: ${o.id} | User: ${o.user?.email} | Product: ${o.product?.name} | Status: ${o.status}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
