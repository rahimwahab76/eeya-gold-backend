import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SupportService {
    constructor(private prisma: PrismaService) { }

    async createTicket(userId: string, subject: string, message: string, category: string) {
        // 1. Find Best Agent (Round Robin / Least Loaded) - Mock: return first admin
        const assignedAdminId = await this.findNextAvailableAgent();

        // 2. Create Ticket
        return this.prisma.supportTicket.create({
            data: {
                userId,
                subject,
                category,
                status: 'PENDING',
                assignedToId: assignedAdminId, // Can be null if no agents
                messages: {
                    create: {
                        senderId: userId,
                        message: message,
                    },
                },
            },
        });
    }

    // Logic: Find ADMIN_SUPPORT with ACTIVE status and Least Tickets
    private async findNextAvailableAgent(): Promise<string | null> {
        // 1. Get all Active Support Admins
        const admins = await this.prisma.user.findMany({
            where: {
                role: 'ADMIN_SUPPORT',
                adminStatus: 'ACTIVE'
            },
            select: {
                id: true,
                _count: {
                    select: { assignedTickets: true } // Assuming 'assignedTickets' is the relation name
                }
            }
        });

        if (admins.length === 0) {
            console.log('[SUPPORT] No Active Admin Support found.');
            return null;
        }

        // 2. Sort by ticket count Ascending (Least busy first)
        admins.sort((a, b) => a._count.assignedTickets - b._count.assignedTickets);

        console.log(`[SUPPORT] Auto-assigning to: ${admins[0].id} (Load: ${admins[0]._count.assignedTickets})`);
        return admins[0].id;
    }

    async getMyTickets(userId: string, role: any) {
        if (role === 'ADMIN_SUPPORT') {
            return this.prisma.supportTicket.findMany({
                where: { assignedToId: userId },
                include: { messages: true },
            });
        } else if (role === 'SUPER_ADMIN') {
            // ADMIN SEES ALL
            return this.prisma.supportTicket.findMany({
                include: { messages: true, assignedTo: true },
            });
        } else {
            // Normal User
            return this.prisma.supportTicket.findMany({
                where: { userId },
                include: { messages: true },
            });
        }
    }

    async replyTicket(ticketId: string, senderId: string, message: string) {
        return this.prisma.supportMessage.create({
            data: {
                ticketId,
                senderId,
                message,
            },
        });
    }
}
