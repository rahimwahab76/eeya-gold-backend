import { Module } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { PrismaService } from '../prisma.service';
import { NotificationModule } from '../notification/notification.module';

import { BonusService } from './bonus.service';
import { ConfigModule } from '../config/config.module';

@Module({
    imports: [NotificationModule, ConfigModule],
    providers: [CommissionService, BonusService, PrismaService],
    exports: [CommissionService, BonusService],
})
export class CommissionModule { }
