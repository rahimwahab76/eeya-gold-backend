
import { Global, Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { PrismaService } from '../prisma.service';

@Global()
@Module({
    controllers: [ConfigController],
    providers: [ConfigService, PrismaService],
    exports: [ConfigService],
})
export class ConfigModule { }
