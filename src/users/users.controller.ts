
import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get(':id')
    getProfile(@Param('id') id: string) {
        return this.usersService.getProfile(id);
    }

    @Put(':id')
    updateProfile(@Param('id') id: string, @Body() body: {
        fullName?: string;
        phone?: string;
        address?: string;
        nextOfKinName?: string;
        nextOfKinPhone?: string;
        nextOfKinRelationship?: string;
    }) {
        return this.usersService.updateProfile(id, body);
    }
}
