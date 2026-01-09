import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        console.log('[DEBUG] PrismaService connecting...');
        await this.$connect();
        console.log('[DEBUG] PrismaService connected!');
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
