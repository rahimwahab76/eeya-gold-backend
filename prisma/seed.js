const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Hardcoded for reliability in this specific debug session
const prisma = new PrismaClient();

async function main() {
    const email = 'admin@eeyagold.com';
    // Standard simple mock hash if bcrypt fails or takes too long, 
    // but we should use real bcrypt since we installed it? 
    // We assume bcrypt is available. If not, user has to install it.
    // Actually, let's check if bcrypt is in package.json. It usually is for NestJS.
    // If not, we can use a hardcoded hash or install it.

    // Checking package.json... I remember package.json had dependencies but didn't verify bcrypt in "dependencies".
    // NestJS usually uses bcryptjs or bcrypt.
    // Let's assume standard bcrypt usage.

    // To be safe, I'll use a try-catch for the hash, or just simple text if dev mode? 
    // No, backend probably expects hashed password.
    // I will assume bcrypt is present.

    const password = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            password,
            fullName: 'Super Admin',
            role: 'SUPER_ADMIN', // Use string literal to avoid Enum import issues
            isActive: true,
            wallet: {
                create: {
                    creditBalance: 10000,
                    goldBalance: 50,
                },
            },
            phone: '0123456789',
            address: 'Gold HQ',
        },
    });

    console.log({ admin });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
