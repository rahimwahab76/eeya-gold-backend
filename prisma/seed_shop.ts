import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Shop Product...');

    // Find an admin user to assign as creator
    const admin = await prisma.user.findFirst({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }
    });

    if (!admin) {
        console.error('No admin found! Cannot seed product.');
        return;
    }

    // Create a product
    const product = await prisma.product.create({
        data: {
            name: 'Eeya Gold Bar 5g (999)',
            description: 'Premium stored gold bar for testing.',
            weight: 5.0,
            purity: '999',
            workmanship: 80.0,
            shippingCost: 15.0,
            price: 0, // Dynamic
            imageUrl: 'https://images.unsplash.com/photo-1610375460993-d60d948716e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            createdBy: admin.id,
            status: 'APPROVED'
        }
    });

    console.log(`Created product: ${product.name} (ID: ${product.id})`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
