
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { GoldModule } from './gold/gold.module';
import { CommissionModule } from './commission/commission.module';
import { SupportModule } from './support/support.module';
import { AuthModule } from './auth/auth.module';
import { NetworkModule } from './network/network.module';
import { ShopModule } from './shop/shop.module';
import { KycModule } from './kyc/kyc.module';
import { AuditModule } from './audit/audit.module';
import { WalletModule } from './wallet/wallet.module';
import { NotificationModule } from './notification/notification.module';
import { ContentModule } from './content/content.module';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma.module';
import { AdminController } from './admin/admin.controller';
import { AdminService } from './admin/admin.service';
import { AuthService } from './auth/auth.service';
import { CommissionService } from './commission/commission.service';
import { GoldService } from './gold/gold.service';
import { UsersService } from './users/users.service';
import { SupportService } from './support/support.service';
import { PrismaService } from './prisma.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UploadModule } from './upload/upload.module';
import { ReportModule } from './report/report.module';

import { PayoutModule } from './payout/payout.module';
import { RedemptionModule } from './redemption/redemption.module';

import { ConfigModule } from './config/config.module';
import { MembershipScheduler } from './scheduler/membership.scheduler';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    PrismaModule,
    GoldModule,
    CommissionModule,
    SupportModule,
    AuthModule,
    NetworkModule,
    ShopModule,
    KycModule,
    AuditModule,
    NotificationModule,
    ContentModule,
    AdminModule,
    UsersModule,
    WalletModule,
    UploadModule,
    ReportModule,
    PayoutModule,
    RedemptionModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    AuthService,
    CommissionService,
    GoldService,
    UsersService,
    SupportService,
    MembershipScheduler,
  ],
})
export class AppModule { }
