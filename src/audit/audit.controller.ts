
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
    constructor(private auditService: AuditService) { }

    @Get('logs/:userId/:role')
    async getLogs(@Param('userId') userId: string, @Param('role') role: string) {
        return this.auditService.getAuditLogs(userId, role);
    }

    @Get('dana-khas/:userId/:role')
    async getDanaKhas(@Param('userId') userId: string, @Param('role') role: string) {
        return this.auditService.getDanaKhasInfo(userId, role);
    }

    @Post('dana-khas/withdraw')
    async withdraw(
        @Body() body: { userId: string; role: string; amount: number; to: string; purpose: string }
    ) {
        return this.auditService.withdrawDanaKhas(body.userId, body.role, body.amount, body.to, body.purpose);
    }
}
