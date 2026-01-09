
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- LATEST APPROVE_TOPUP LOGS ---');
    const logs = await prisma.auditLog.findMany({
        where: { action: 'APPROVE_TOPUP' },
        take: 3,
        orderBy: { timestamp: 'desc' },
        include: {
            performer: {
                select: { id: true, fullName: true, role: true }
            }
        }
    });

    if (logs.length === 0) {
        console.log('No APPROVE_TOPUP logs found.');
    } else {
        console.log(JSON.stringify(logs, null, 2));
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
