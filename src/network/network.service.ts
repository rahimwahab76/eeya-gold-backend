
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface NetworkNode {
    id: string;
    name: string;
    rank: 'GOLD' | 'SILVER' | 'BRONZE' | 'BASIC';
    personalSales: number;
    groupSales: number;
    children?: NetworkNode[];
}

@Injectable()
export class NetworkService {
    constructor(private prisma: PrismaService) { }
    async getTree(userId: string): Promise<NetworkNode> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                downlines: {
                    include: {
                        downlines: {
                            include: {
                                downlines: true // 3 Levels deep
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            throw new Error('User not found');
        }

        return this.mapUserToNode(user);
    }

    private mapUserToNode(user: any): NetworkNode {
        return {
            id: user.id,
            name: user.fullName || 'Unknown',
            rank: 'GOLD', // Hardcoded for now as Rank is not fully implemented
            personalSales: user.currentMonthPersonalSales || 0,
            groupSales: 0, // Needs calculation logic
            children: user.downlines ? user.downlines.map(child => this.mapUserToNode(child)) : []
        };
    }
}
