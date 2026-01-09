
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async updateProfile(userId: string, data: {
        fullName?: string;
        phone?: string;
        address?: string;
        nextOfKinName?: string;
        nextOfKinPhone?: string;
        nextOfKinRelationship?: string;
    }) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: {
                fullName: data.fullName,
                phone: data.phone,
                address: data.address,
                nextOfKinName: data.nextOfKinName,
                nextOfKinPhone: data.nextOfKinPhone,
                nextOfKinRelationship: data.nextOfKinRelationship,
            }
        });
    }

    async getProfile(userId: string) {
        return this.prisma.user.findUnique({ where: { id: userId } });
    }
}
