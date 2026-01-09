
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GoldService } from './gold.service';
import axios from 'axios';

@Injectable()
export class GoldScheduler {
    private readonly logger = new Logger(GoldScheduler.name);

    constructor(private readonly goldService: GoldService) { }

    // Run every 5 minutes
    @Cron('0 */5 * * * *')
    async handleCron() {
        this.logger.debug('Fetching Live Gold Price from goldprice.org...');
        try {
            // Fetch Spot Price in MYR
            // API: https://data-asg.goldprice.org/dbXRates/MYR
            const response = await axios.get('https://data-asg.goldprice.org/dbXRates/MYR', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            // Expected payload: { "items": [ { "curr": "MYR", "xauPrice": 12750.50, "xagPrice": ... } ], "date": ... }
            if (response.data && response.data.items && response.data.items.length > 0) {
                const item = response.data.items[0];
                const spotPriceMyr = item.xauPrice; // This is usually price per Ounce

                if (spotPriceMyr && spotPriceMyr > 0) {
                    // Web Search confirmed Market Price ~ RM 585/g (Jan 2026).
                    // API 18195 corresponds to 1 Troy Ounce.
                    const spotPricePerGram = spotPriceMyr / 31.1035;
                    await this.goldService.updatePriceFromSpot(spotPricePerGram);
                    this.logger.log(`Updated Gold Price: Spot MYR ${spotPricePerGram.toFixed(2)} /g (Src: ${spotPriceMyr})`);
                }
            }
        } catch (error) {
            this.logger.error('Failed to fetch gold price', error);
        }
    }
}
