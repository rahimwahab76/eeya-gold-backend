
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- VERIFYING RELATIONS ---');

    // 1. Create a dummy admin
    const dummyAdmin = await prisma.user.create({
        data: {
            email: `debug_admin_${Date.now()}@test.com`,
            password: 'password',
            fullName: 'Debug Admin (Relation Test)',
            role: 'ADMIN',
            isActive: true,
            phone: `012${Date.now()}`
        }
    });
    console.log('Created Dummy Admin:', dummyAdmin.id, dummyAdmin.fullName);

    // 2. Create an audit log for this admin
    const log = await prisma.auditLog.create({
        data: {
            action: 'DEBUG_TEST_ACTION',
            performedBy: dummyAdmin.id, // Link to the created admin
            details: 'Testing relation integrity',
            timestamp: new Date()
        }
    });
    console.log('Created Audit Log:', log.id);

    // 3. Fetch the log back WITH INCLUDE
    const fetchedLog = await prisma.auditLog.findUnique({
        where: { id: log.id },
        include: {
            performer: {
                select: { id: true, fullName: true, role: true }
            }
        }
    });

    console.log('\n--- FETCHED RESULT ---');
    console.log(JSON.stringify(fetchedLog, null, 2));

    if (fetchedLog?.performer) {
        console.log('\nSUCCESS: Performer relation is WORKING correctly.');
    } else {
        console.log('\nFAILURE: Performer is NULL despite valid ID.');
    }

    // Cleanup
    await prisma.auditLog.delete({ where: { id: log.id } });
    await prisma.user.delete({ where: { id: dummyAdmin.id } });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
