
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RedemptionService } from './redemption.service';

@Controller('redemption')
export class RedemptionController {
    constructor(private redemptionService: RedemptionService) { }

    @Get('pending')
    async getPending() {
        return this.redemptionService.getPendingRequests();
    }

    @Get('all')
    async getAllRequests() {
        return this.redemptionService.getAllRequests();
    }

    @Get('user/:userId')
    async getUserRequests(@Param('userId') userId: string) {
        return this.redemptionService.getUserRequests(userId);
    }

    @Post('request')
    async requestRedemption(@Body() body: { userId: string, grams: number, shippingAddress: string }) {
        return this.redemptionService.requestRedemption(body.userId, body.grams, body.shippingAddress);
    }

    @Post('approve/:id')
    async approveRedemption(@Param('id') id: string, @Body() body: { adminId: string }) {
        return this.redemptionService.approveRedemption(id, body.adminId);
    }

    @Post('packaging/:id')
    async markAsPackaging(@Param('id') id: string, @Body() body: { adminId: string }) {
        return this.redemptionService.markAsPackaging(id, body.adminId);
    }

    @Post('update-tracking')
    async updateTracking(@Body() body: { requestId: string, trackingNumber: string, adminId: string }) {
        return this.redemptionService.updateTracking(body.requestId, body.trackingNumber, body.adminId);
    }
}
