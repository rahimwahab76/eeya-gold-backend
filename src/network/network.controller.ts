
import { Controller, Get, Param } from '@nestjs/common';
import { NetworkService } from './network.service';

@Controller('network')
export class NetworkController {
    constructor(private readonly networkService: NetworkService) { }

    @Get('tree/:userId')
    async getTree(@Param('userId') userId: string) {
        return this.networkService.getTree(userId);
    }
}
