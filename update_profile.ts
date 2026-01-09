
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Updating Company Profile directly...');

    const directorBio = `Undoubtedly, the journey for Public Gold Group was challenging when the company first started. However, with determination, diligence, and teamwork, they excelled tremendously.

Established in 2008 by Dato' Seri Louis Ng, Public Gold has grown to become a market leader in gold trading. The company is a pioneer in Malaysia's precious metal industry, providing Shariah-compliant silver and gold products with 916 and 999.9 purity. Public Gold has achieved significant milestones since its inception, expanding its services to include customized gold products, minting and refinery operations, and a unique sharing economy business model.

Public Gold is trusted by over 2.2 million customers worldwide and operates 27 physical service centers across Malaysia. The company has also expanded internationally with branches in Singapore and Indonesia, and gold ATMs deployed in Malaysia, Indonesia, and the UAE. Public Gold is recognized as the world's first Shariah-compliant gold company, with all transactions aligning with Islamic principles under the supervision of Amanie Advisors Sdn Bhd's Shariah Panel.

Beyond its core gold trading business, Public Gold Group has diversified into other ventures, including Public Safe (a secure facility for valuables), PG Mall (an e-commerce platform), and the PG Gold Museum, Malaysia's first gold museum. The company is also a key participant in the Malaysia Gold Association (MGA).`;

    await prisma.companyProfile.upsert({
        where: { id: 'profile-1' },
        update: {
            companyName: 'EEYA GOLD',
            directorName: "Dato' Rahim Wahab",
            directorImageUrl: '/uploads/dato_rahim.jpg',
            directorBio: directorBio,
        },
        create: {
            id: 'profile-1',
            termsContent: 'Default Terms...',
            disclaimer: 'Default Disclaimer...',
            companyName: 'EEYA GOLD',
            companyDescription: 'Trusted Gold Partner',
            directorName: "Dato' Rahim Wahab",
            directorImageUrl: '/uploads/dato_rahim.jpg',
            directorBio: directorBio,
        }
    });

    console.log('Company Profile updated successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
