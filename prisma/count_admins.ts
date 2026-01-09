import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const superAdminCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
    const adminAuditCount = await prisma.user.count({ where: { role: 'ADMIN_AUDIT' } });
    const adminOperasiCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const adminSupportCount = await prisma.user.count({ where: { role: 'ADMIN_SUPPORT' } });

    console.log('--- Admin Counts ---');
    console.log(`Super Admin: ${superAdminCount}`);
    console.log(`Admin Audit: ${adminAuditCount}`);
    console.log(`Admin Operasi: ${adminOperasiCount}`);
    console.log(`Admin Support: ${adminSupportCount}`);
    console.log('--------------------');
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
