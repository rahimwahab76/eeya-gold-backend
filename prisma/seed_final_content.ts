import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Final Content Seeding...');

    // 1. Find Admin
    const admin = await prisma.user.findFirst({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }
    });

    if (!admin) {
        console.error('No admin found!');
        return;
    }

    // 2. Add Gelang Bayi
    console.log('Creating Product: Gelang Bayi...');
    const existingProduct = await prisma.product.findFirst({
        where: { name: 'Gelang Bayi Emas 916' }
    });

    if (!existingProduct) {
        await prisma.product.create({
            data: {
                name: 'Gelang Bayi Emas 916',
                description: 'Gelang tangan bayi padu, emas 916 asli. Sesuai untuk hadiah.',
                weight: 3.0,
                purity: '916',
                workmanship: 45.0,
                shippingCost: 12.0,
                price: 0, // Dynamic
                // Use LAN IP for serving image to mobile
                imageUrl: 'http://192.168.0.58:3000/uploads/gelang_bayi.jpg',
                createdBy: admin.id,
                status: 'APPROVED'
            }
        });
        console.log('✅ Product Created.');
    } else {
        console.log('ℹ️ Product already exists.');
    }

    // 3. Add Banners
    console.log('Seeding Banners...');
    const banners = [
        {
            imageUrl: 'https://images.unsplash.com/photo-1610375461490-6d615d985552?auto=format&fit=crop&w=800&q=80',
            title: 'Promosi Emas 916',
            linkUrl: 'https://eeyagold.com'
        },
        {
            imageUrl: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=800&q=80',
            title: 'Koleksi Terbaru',
            linkUrl: null
        },
        {
            imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
            title: 'Simpanan Masa Depan',
            linkUrl: null
        }
    ];

    for (const b of banners) {
        // Check duplicate by image URL
        const exists = await prisma.banner.findFirst({ where: { imageUrl: b.imageUrl } });
        if (!exists) {
            await prisma.banner.create({
                data: {
                    ...b,
                    isActive: true
                }
            });
            console.log(`✅ Banner created: ${b.title}`);
        }
    }

    console.log('🎉 Seeding Complete!');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
