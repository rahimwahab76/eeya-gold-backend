import { Module } from '@nestjs/common';
import { GoldController } from './gold.controller';
import { GoldService } from './gold.service';
import { GoldScheduler } from './gold.scheduler';
import { CommissionModule } from '../commission/commission.module';
import { PrismaService } from '../prisma.service';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [CommissionModule, AuditModule, NotificationModule],
  controllers: [GoldController],
  providers: [GoldService, PrismaService, GoldScheduler],
  exports: [GoldService],
})
export class GoldModule { }
