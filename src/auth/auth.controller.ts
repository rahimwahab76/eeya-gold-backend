
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    login(@Body() body: { email: string; password?: string }) {
        return this.authService.login(body.email, body.password);
    }

    @Post('register')
    register(@Body() body: { email: string; fullName: string; phone: string; password: string; referralCode?: string }) {
        return this.authService.register(body);
    }

    // Temporary endpoint to backfill IDs
    @Post('backfill-ids')
    backfillIds() {
        return this.authService.backfillMemberIds();
    }
}
