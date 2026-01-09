import { Body, Controller, Get, Post, Delete, Patch, Param } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller('content')
export class ContentController {
    constructor(private readonly contentService: ContentService) { }

    @Get('daily-message')
    getDailyMessage() {
        return this.contentService.getDailyMessage();
    }

    // Admin only endpoint (In real app, add @UseGuards(RolesGuard))
    @Post('daily-message')
    updateDailyMessage(@Body() body: { text: string; author: string; isActive: boolean }) {
        return this.contentService.updateDailyMessage(body.text, body.author, body.isActive);
    }

    // --- Banners ---

    @Get('banners')
    getBanners() {
        return this.contentService.getBanners();
    }

    @Get('admin/banners')
    getAllBannersAdmin() {
        return this.contentService.getAllBannersAdmin();
    }

    @Post('banners')
    createBanner(@Body() body: { imageUrl: string; linkUrl?: string }) {
        return this.contentService.createBanner(body.imageUrl, body.linkUrl);
    }

    @Delete('banners/:id')
    deleteBanner(@Param('id') id: string) {
        return this.contentService.deleteBanner(id);
    }

    @Patch('banners/:id')
    toggleBanner(@Param('id') id: string, @Body() body: { isActive: boolean }) {
        return this.contentService.toggleBanner(id, body.isActive);
    }

    // --- Company Profile ---

    @Get('company-profile')
    getCompanyProfile() {
        return this.contentService.getCompanyProfile();
    }

    @Post('company-profile')
    updateCompanyProfile(@Body() body: any) {
        // ideally validate admin role here
        return this.contentService.updateCompanyProfile(body);
    }
}
