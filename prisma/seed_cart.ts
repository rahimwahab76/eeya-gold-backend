import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const userId = '98418a71-c87a-454c-8ef1-1a51e9dda684'; // The ID we found

    // 1. Get Product
    const product = await prisma.product.findFirst({
        where: { name: 'Gelang Bayi Emas 916' }
    });

    if (!product) {
        console.error('Product not found!');
        return;
    }

    // 2. Ensure Wallet has balance (just in case)
    await prisma.wallet.upsert({
        where: { userId },
        update: { creditBalance: 5000 },
        create: { userId, creditBalance: 5000 }
    });

    // 3. Create Cart
    console.log('Creating Cart...');
    const cart = await prisma.cart.upsert({
        where: { userId },
        update: {},
        create: { userId }
    });

    // 4. Add Item
    console.log('Adding Item...');
    await prisma.cartItem.create({
        data: {
            cartId: cart.id,
            productId: product.id,
            quantity: 1
        }
    });

    console.log('✅ Cart Seeded with Gelang Bayi!');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
