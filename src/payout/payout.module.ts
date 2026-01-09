
import { Module } from '@nestjs/common';
import { PayoutController } from './payout.controller';
import { PayoutService } from './payout.service';
import { PrismaService } from '../prisma.service';
import { NotificationModule } from '../notification/notification.module';
import { CommissionModule } from '../commission/commission.module';

@Module({
    imports: [NotificationModule, CommissionModule],
    controllers: [PayoutController],
    providers: [PayoutService, PrismaService],
})
export class PayoutModule { }
