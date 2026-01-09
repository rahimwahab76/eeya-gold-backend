import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ContentService {
    constructor(private prisma: PrismaService) { }

    // --- Daily Message (Mock for now, can be moved to DB) ---
    private dailyMessage = {
        text: '“Sesungguhnya Allah memberi rezeki kepada siapa yang dikehendaki-Nya tanpa hisab.” (Surah Ali Imran: 37)',
        author: 'Al-Quran',
        isActive: true,
    };

    getDailyMessage() {
        return this.dailyMessage;
    }

    updateDailyMessage(text: string, author: string, isActive: boolean) {
        this.dailyMessage = { text, author, isActive };
        return this.dailyMessage;
    }

    // --- Banners (Real DB) ---
    async getBanners() {
        return this.prisma.banner.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });
    }

    async getAllBannersAdmin() {
        return this.prisma.banner.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    async createBanner(imageUrl: string, linkUrl?: string) {
        return this.prisma.banner.create({
            data: {
                imageUrl,
                linkUrl,
                isActive: true,
            },
        });
    }

    async deleteBanner(id: string) {
        return this.prisma.banner.delete({ where: { id } });
    }

    async toggleBanner(id: string, isActive: boolean) {
        return this.prisma.banner.update({
            where: { id },
            data: { isActive }
        });
    }

    // --- Company Profile (Terms & Company Info) ---

    async getCompanyProfile() {
        let profile = await this.prisma.companyProfile.findUnique({
            where: { id: 'profile-1' }
        });

        if (!profile) {
            // Lazy initialization
            profile = await this.prisma.companyProfile.create({
                data: {
                    id: 'profile-1',
                    termsContent: 'Default Terms...',
                    disclaimer: 'Default Disclaimer...',
                    companyName: 'EEYA GOLD',
                    companyDescription: 'Trusted Gold Partner',
                    directorName: "Dato' Rahim Wahab",
                    directorImageUrl: '/uploads/dato_rahim.jpg',
                    directorBio: `Undoubtedly, the journey for Public Gold Group was challenging when the company first started. However, with determination, diligence, and teamwork, they excelled tremendously.

Established in 2008 by Dato' Seri Louis Ng, Public Gold has grown to become a market leader in gold trading. The company is a pioneer in Malaysia's precious metal industry, providing Shariah-compliant silver and gold products with 916 and 999.9 purity. Public Gold has achieved significant milestones since its inception, expanding its services to include customized gold products, minting and refinery operations, and a unique sharing economy business model.

Public Gold is trusted by over 2.2 million customers worldwide and operates 27 physical service centers across Malaysia. The company has also expanded internationally with branches in Singapore and Indonesia, and gold ATMs deployed in Malaysia, Indonesia, and the UAE. Public Gold is recognized as the world's first Shariah-compliant gold company, with all transactions aligning with Islamic principles under the supervision of Amanie Advisors Sdn Bhd's Shariah Panel.

Beyond its core gold trading business, Public Gold Group has diversified into other ventures, including Public Safe (a secure facility for valuables), PG Mall (an e-commerce platform), and the PG Gold Museum, Malaysia's first gold museum. The company is also a key participant in the Malaysia Gold Association (MGA).`,
                }
            });
        }
        return profile;
    }

    async updateCompanyProfile(data: any) {
        // Ensure profile exists first
        await this.getCompanyProfile();

        return this.prisma.companyProfile.update({
            where: { id: 'profile-1' },
            data: {
                ...data,
                // Ensure id isn't overwritten
                id: undefined,
            }
        });
    }
}
