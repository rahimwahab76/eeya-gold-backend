
import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
    constructor(private walletService: WalletService) { }

    @Post('topup/:userId')
    requestTopUp(@Param('userId') userId: string, @Body() body: { amount: number; proofImageUrl: string; purpose?: string }) {
        return this.walletService.requestTopUp(userId, body.amount, body.proofImageUrl, body.purpose);
    }

    @Get('topup/pending')
    getPendingTopUps() {
        return this.walletService.getPendingTopUps();
    }

    @Post('topup/:id/approve')
    approveTopUp(@Param('id') id: string, @Body() body: { adminId: string; finalAmount: number; targetType?: string }) {
        // Enforce valid adminId
        if (!body.adminId) throw new Error('Admin ID is required');
        return this.walletService.approveTopUp(body.adminId, id, body.finalAmount, body.targetType);
    }

    @Post('topup/:id/reject')
    async rejectTopUp(@Param('id') id: string, @Body() body: { reason: string, adminId: string }) {
        if (!body.adminId) throw new Error('Admin ID is required');
        return this.walletService.rejectTopUp(body.adminId, id, body.reason);
    }

    @Post('admin/credit-rebate')
    async creditRebate(@Body() body: { userId: string, amount: number, reason: string, adminId: string }) {
        return this.walletService.creditRebate(body.adminId, body.userId, body.amount, body.reason);
    }
}
