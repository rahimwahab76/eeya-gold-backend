
import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
// PrismaModule is global, so no need to import

import { NotificationModule } from '../notification/notification.module';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [NotificationModule, AuditModule],
    controllers: [KycController],
    providers: [KycService],
})
export class KycModule { }
