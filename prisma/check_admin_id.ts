
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const targetId = '821dfdf3-f4f5-4d30-8ceb-468aa61f92a0';
    console.log(`Checking user with ID: ${targetId}`);

    const user = await prisma.user.findUnique({
        where: { id: targetId }
    });

    if (user) {
        console.log('FOUND USER:', JSON.stringify(user, null, 2));
    } else {
        console.log('USER NOT FOUND in database!');
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
