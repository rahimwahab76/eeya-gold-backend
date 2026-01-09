
import { Controller, Get, Post, Body, Param, BadRequestException } from '@nestjs/common';
import { GoldService } from './gold.service';
// Auth Guards removed as they are not available in this codebase structure currently

@Controller('gold')
export class GoldController {
    constructor(private readonly goldService: GoldService) { }

    @Get('latest')
    async getLatestPrice() {
        return this.goldService.getPrice();
    }

    @Get('price')
    async getLegacyPrice() {
        return this.goldService.getPrice();
    }

    @Get('stock')
    async getStock() {
        return this.goldService.getCompanyStock();
    }

    @Get('wallet/:userId')
    async getWallet(@Param('userId') userId: string) {
        return this.goldService.getWallet(userId);
    }

    @Get('transactions/:userId')
    async getTransactions(@Param('userId') userId: string) {
        return this.goldService.getTransactions(userId);
    }

    @Post('lock')
    async lockPrice() {
        return this.goldService.lockPrice();
    }

    @Post('buy')
    async buyGold(@Body() body: { userId: string; gram: number; lockId: string }) {
        return this.goldService.buyGold(body.userId, body.gram, body.lockId);
    }

    @Post('sell')
    async sellGold(@Body() body: { userId: string; gram: number; lockId: string }) {
        return this.goldService.sellGold(body.userId, body.gram, body.lockId);
    }

    // New Endpoint: Config for Spreads
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles('ADMIN')
    @Post('config')
    async updateConfig(@Body() body: { sellSpread: number; buySpread: number }) {
        if (body.sellSpread === undefined || body.buySpread === undefined) {
            throw new BadRequestException('sellSpread and buySpread are required');
        }
        return this.goldService.updateConfig(body.sellSpread, body.buySpread);
    }

    // Existing but updated Endpoint: Manual Update (now acts as Override or Shim)
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles('ADMIN')
    @Post('update')
    async updatePrice(@Body() body: { buy: number; sell: number; buy916: number; sell916: number }) {
        return this.goldService.updatePrice(body.buy, body.sell, body.buy916, body.sell916);
    }
}
