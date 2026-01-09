
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- ADMIN USERS ---');
    const admins = await prisma.user.findMany({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN', 'ADMIN_AUDIT', 'ADMIN_SUPPORT'] } },
        select: { id: true, fullName: true, role: true }
    });
    console.log(JSON.stringify(admins, null, 2));

    console.log('\n--- LATEST 5 AUDIT LOGS ---');
    const logs = await prisma.auditLog.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' },
        include: {
            performer: {
                select: { id: true, fullName: true, role: true }
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
