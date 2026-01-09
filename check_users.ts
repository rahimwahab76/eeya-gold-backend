
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.user.count();
    console.log(`Total Users: ${count}`);

    if (count > 0) {
        const users = await prisma.user.findMany({ take: 5 });
        console.log('Sample Users:', users.map(u => ({ id: u.id, email: u.email, name: u.fullName })));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
