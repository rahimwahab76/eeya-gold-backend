
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from './config.service';
// import { RolesGuard } from '../auth/roles.guard'; // Assume Guard exists
// import { Roles } from '../auth/roles.decorator';

@Controller('config')
export class ConfigController {
    constructor(private configService: ConfigService) { }

    @Get()
    async getAll() {
        await this.configService.loadConfig(); // Refresh cache
        return {
            MONTHLY_BONUS_MIN_GRAMS: this.configService.get('MONTHLY_BONUS_MIN_GRAMS'),
            YEARLY_BONUS_MIN_GRAMS: this.configService.get('YEARLY_BONUS_MIN_GRAMS'),
            BONUS_SPONSOR_RATE: this.configService.get('BONUS_SPONSOR_RATE'),
            BONUS_YEARLY_RATE: this.configService.get('BONUS_YEARLY_RATE'),
            BONUS_DOWNLINE_PURCHASE_RATE: this.configService.get('BONUS_DOWNLINE_PURCHASE_RATE'),
            BONUS_TIER_1_THRESHOLD: this.configService.get('BONUS_TIER_1_THRESHOLD'),
            BONUS_TIER_1_RATE: this.configService.get('BONUS_TIER_1_RATE'),
            BONUS_TIER_2_THRESHOLD: this.configService.get('BONUS_TIER_2_THRESHOLD'),
            BONUS_TIER_2_RATE: this.configService.get('BONUS_TIER_2_RATE'),
            BONUS_TIER_3_THRESHOLD: this.configService.get('BONUS_TIER_3_THRESHOLD'),
            BONUS_TIER_3_RATE: this.configService.get('BONUS_TIER_3_RATE'),
        };
    }

    @Post()
    // @Roles('SUPER_ADMIN')
    async updateConfig(@Body() body: { key: string, value: string }) {
        await this.configService.setConfig(body.key, body.value);
        return { success: true };
    }
}
