import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }, // Assuming user is using the admin account
        orderBy: { updatedAt: 'desc' },
    });

    if (user) {
        console.log('USER_ID:' + user.id);
    } else {
        console.log('User not found');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
