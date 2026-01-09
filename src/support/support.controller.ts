import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
    constructor(private supportService: SupportService) { }

    @Post('ticket')
    createTicket(@Body() body: { userId: string; subject: string; message: string; category: string }) {
        return this.supportService.createTicket(body.userId, body.subject, body.message, body.category);
    }

    @Get('tickets/:userId/:role')
    getTickets(@Param('userId') userId: string, @Param('role') role: string) {
        return this.supportService.getMyTickets(userId, role);
    }

    @Post('reply')
    replyTicket(@Body() body: { ticketId: string; senderId: string; message: string }) {
        return this.supportService.replyTicket(body.ticketId, body.senderId, body.message);
    }
}
