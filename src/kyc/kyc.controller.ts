
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { KycService } from './kyc.service';

@Controller('kyc')
export class KycController {
    constructor(private kycService: KycService) { }

    @Post('submit/:userId') // In real app, get userId from JWT
    submitKyc(@Param('userId') userId: string, @Body() body: any) {
        return this.kycService.submitKyc(userId, body);
    }

    @Get('pending')
    getPendingKyc() {
        return this.kycService.getPendingKyc();
    }

    @Post('approve/:userId')
    approveKyc(@Param('userId') userId: string, @Body() body: { adminId: string }) {
        return this.kycService.approveKyc(userId, body.adminId);
    }

    @Get('status/:userId')
    getKycStatus(@Param('userId') userId: string) {
        return this.kycService.getKycStatus(userId);
    }

    @Post('reject/:userId')
    rejectKyc(@Param('userId') userId: string, @Body() body: { adminId: string, reason: string }) {
        return this.kycService.rejectKyc(userId, body.adminId, body.reason);
    }
}
