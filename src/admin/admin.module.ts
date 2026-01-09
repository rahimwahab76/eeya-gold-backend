
import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaService } from '../prisma.service';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notification/notification.module';

import { GoldModule } from '../gold/gold.module';

@Module({
    imports: [AuditModule, NotificationModule, GoldModule],
    controllers: [AdminController],
    providers: [AdminService, PrismaService],
})
export class AdminModule { }
