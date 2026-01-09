
import { Body, Controller, Get, Param, Post, UseGuards, UnauthorizedException } from '@nestjs/common';
import { PayoutService } from './payout.service';
import { BonusService } from '../commission/bonus.service';

@Controller('payout')
export class PayoutController {
    constructor(
        private payoutService: PayoutService,
        private bonusService: BonusService
    ) { }

    @Get('pending')
    async getPendingPayouts() {
        return this.payoutService.getPendingPayouts();
    }

    @Post('process')
    async processPayout(@Body() body: { adminId: string, userId: string, action: 'PAY' | 'FORFEIT' }) {
        if (!['PAY', 'FORFEIT'].includes(body.action)) {
            throw new Error('Invalid Action');
        }
        return this.payoutService.processPayout(body.adminId, body.userId, body.action);
    }

    @Post('run-monthly-closing')
    async runMonthlyClosing(@Body() body: { adminId: string, month: string }) {
        return this.bonusService.runMonthlyClosing(body.month, body.adminId);
    }

    @Post('run-yearly-closing')
    async runYearlyClosing(@Body() body: { adminId: string, year: string }) {
        return this.bonusService.runYearlyClosing(body.year, body.adminId);
    }
}
