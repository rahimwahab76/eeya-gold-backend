
import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ShopService } from './shop.service';

@Controller('shop')
export class ShopController {
    constructor(private readonly shopService: ShopService) { }

    @Get('products')
    getApprovedProducts() {
        return this.shopService.getApprovedProducts();
    }

    @Get('products/admin')
    getAllProducts() {
        // In real app, verify Admin Guard here
        return this.shopService.getAllProducts();
    }

    @Post('products')
    createProduct(@Body() body: any) {
        console.log('[DEBUG] Create Product Payload:', body);
        // Expecting body to contain product details + userId
        return this.shopService.createProduct(body, body.userId);
    }

    @Patch('products/:id/approve')
    approveProduct(@Param('id') id: string, @Body('role') role: string) {
        return this.shopService.approveProduct(id, role);
    }
    @Post('checkout')
    checkout(@Body('userId') userId: string) {
        if (!userId) throw new Error('UserId is required');
        return this.shopService.checkout(userId);
    }

    @Post('cart/add')
    addToCart(@Body() body: { userId: string, productId: string, quantity: number }) {
        if (!body.userId || !body.productId) throw new Error('Missing cart details');
        return this.shopService.addToCart(body.userId, body.productId, body.quantity || 1);
    }

    @Get('orders/my')
    getUserOrders(@Query('userId') userId: string) {
        if (!userId) throw new Error('UserId is required');
        return this.shopService.getUserOrders(userId);
    }

    @Get('orders/all')
    getAllOrders() {
        return this.shopService.getAllOrders();
    }
}
