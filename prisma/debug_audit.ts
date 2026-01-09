
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching last 5 audit logs...');
    const logs = await prisma.auditLog.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' },
        include: {
            performer: {
                select: { fullName: true, role: true, email: true }
            }
        }
    });

    console.log(JSON.stringify(logs, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
