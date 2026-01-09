
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ConfigService implements OnModuleInit {
    private configCache: Record<string, string> = {};

    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        await this.loadConfig();
    }

    async loadConfig() {
        const configs = await this.prisma.systemConfig.findMany();
        configs.forEach(c => this.configCache[c.key] = c.value);

        // Seed Defaults if missing
        if (!this.configCache['MONTHLY_BONUS_MIN_GRAMS']) {
            await this.setConfig('MONTHLY_BONUS_MIN_GRAMS', '0.25', 'Minimum personal sales for monthly bonus');
        }
        if (!this.configCache['YEARLY_BONUS_MIN_GRAMS']) {
            await this.setConfig('YEARLY_BONUS_MIN_GRAMS', '3.0', 'Minimum personal sales for yearly bonus');
        }
        // New Bonus Defaults
        if (!this.configCache['BONUS_SPONSOR_RATE']) await this.setConfig('BONUS_SPONSOR_RATE', '0.005', 'Sponsor Bonus Rate (0.5%)');
        if (!this.configCache['BONUS_DOWNLINE_PURCHASE_RATE']) await this.setConfig('BONUS_DOWNLINE_PURCHASE_RATE', '0.01', 'Downline Purchase Commission (1.0%)');

        if (!this.configCache['BONUS_TIER_1_THRESHOLD']) await this.setConfig('BONUS_TIER_1_THRESHOLD', '10000', 'Tier 1 Sales Threshold');
        if (!this.configCache['BONUS_TIER_1_RATE']) await this.setConfig('BONUS_TIER_1_RATE', '0.0025', 'Tier 1 Rate (0.25%)');

        if (!this.configCache['BONUS_TIER_2_THRESHOLD']) await this.setConfig('BONUS_TIER_2_THRESHOLD', '50000', 'Tier 2 Sales Threshold');
        if (!this.configCache['BONUS_TIER_2_RATE']) await this.setConfig('BONUS_TIER_2_RATE', '0.005', 'Tier 2 Rate (0.50%)');

        if (!this.configCache['BONUS_TIER_3_THRESHOLD']) await this.setConfig('BONUS_TIER_3_THRESHOLD', '100000', 'Tier 3 Sales Threshold');
        if (!this.configCache['BONUS_TIER_3_RATE']) await this.setConfig('BONUS_TIER_3_RATE', '0.01', 'Tier 3 Rate (1.00%)');
    }

    get(key: string): string | undefined {
        return this.configCache[key];
    }

    getNumber(key: string, defaultValue: number): number {
        const val = this.configCache[key];
        return val ? parseFloat(val) : defaultValue;
    }

    async setConfig(key: string, value: string, description?: string) {
        await this.prisma.systemConfig.upsert({
            where: { key },
            update: { value, description },
            create: { key, value, description }
        });
        this.configCache[key] = value;
    }
}
