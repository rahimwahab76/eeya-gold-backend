
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Product } from '@prisma/client';

@Injectable()
export class ShopService {
    constructor(
        private prisma: PrismaService,
        // Inject GoldService to get live price? No, avoiding circular dep if possible.
        // We can fetch price directly from DB using Prisma for now or assume GoldService is available.
        // For simplicity, let's read the latest GoldPrice from DB directly.
    ) { }

    // Admin Support creates product
    async createProduct(data: any, userId?: string) {
        let finalUserId = userId;

        // Fallback: If no userId provided, use the hardcoded Admin
        if (!finalUserId) {
            console.log('[WARN] No userId provided in request. Falling back to Admin.');
            const admin = await this.prisma.user.findUnique({ where: { email: 'admin@eeyagold.com' } });
            if (admin) {
                finalUserId = admin.id;
            } else {
                throw new Error('User ID missing and Admin not found.');
            }
        }

        return this.prisma.product.create({
            data: {
                ...data,
                name: data.name || 'Untitled Product', // Ensure name is set if not in data
                description: data.description || '', // Ensure description is set if not in data
                price: parseFloat(data.price as any) || 0,
                weight: parseFloat(data.weight as any) || 0,
                purity: data.purity || '916', // Ensure purity is set if not in data
                // Force cast as any to bypass stale types
                workmanship: typeof data.workmanship === 'string' ? parseFloat(data.workmanship) : (data as any).workmanship || 0,
                shippingCost: typeof data.shippingCost === 'string' ? parseFloat(data.shippingCost) : (data as any).shippingCost || 0,
                imageUrl: data.imageUrl || 'https://via.placeholder.com/150', // Ensure imageUrl is set if not in data
                status: 'APPROVED', // Auto-approve
                createdBy: finalUserId,
            } as any, // Cast the entire data object to any to allow for flexible input
        });
    }

    // Checkout Logic
    async checkout(userId: string) {
        // 1. Get Live 916 Price
        const goldPrice = await this.prisma.goldPrice.findFirst({
            orderBy: { timestamp: 'desc' },
        });

        if (!goldPrice) throw new NotFoundException('Gold Price not available.');
        const currentRate916 = goldPrice.sell916 ?? 0;

        // 2. Get User Cart and Wallet
        const cart = await this.prisma.cart.findUnique({
            where: { userId },
            include: { items: { include: { product: true } } },
        });

        if (!cart || cart.items.length === 0) {
            throw new NotFoundException('Cart is empty.');
        }

        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new NotFoundException('Wallet not found.');

        // 3. Calculate Total
        let totalCost = 0;
        const orderItems: any[] = [];

        for (const item of cart.items) {
            const product: any = item.product;
            // Formula: (Weight * Rate) + Workmanship + Shipping
            const goldCost = product.weight * currentRate916;
            const itemTotal = goldCost + (product.workmanship || 0) + (product.shippingCost || 0);

            totalCost += itemTotal;
            orderItems.push({
                product,
                priceAtPurchase: currentRate916,
                itemTotal,
                goldCost
            });
        }

        // 4. Check Balance
        if (wallet.creditBalance < totalCost) {
            throw new ForbiddenException(`Insufficient E-Kredit. Required: RM${totalCost.toFixed(2)}, Available: RM${wallet.creditBalance.toFixed(2)}`);
        }

        // 5. Execute Transaction
        return this.prisma.$transaction(async (tx: any) => {
            // Deduct Wallet
            await tx.wallet.update({
                where: { userId },
                data: { creditBalance: { decrement: totalCost } },
            });

            // Create Order Records
            for (const item of orderItems) {
                await tx.productOrder.create({
                    data: {
                        userId,
                        productId: item.product.id,
                        priceAtPurchase: currentRate916,
                        workmanship: item.product.workmanship,
                        shippingCost: item.product.shippingCost,
                        weight: item.product.weight,
                        totalPaid: item.itemTotal,
                        status: 'PAID',
                    }
                });
            }

            // Create Ledger Entry
            await tx.eKreditLedger.create({
                data: {
                    userId,
                    refNo: `SHOP-${Date.now()}`, // Temporary Ref
                    inRM: 0,
                    outRM: totalCost,
                    balanceRM: wallet.creditBalance - totalCost,
                }
            });

            // Clear Cart
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id },
            });

            return { success: true, totalPaid: totalCost };
        });
    }

    // Super Admin approves product
    async approveProduct(productId: string, adminRole: string) {
        if (adminRole !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Only Super Admin can approve products.');
        }

        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new NotFoundException('Product not found');

        return this.prisma.product.update({
            where: { id: productId },
            data: { status: 'APPROVED' },
        });
    }

    // Public/User: List Approved Only
    async getApprovedProducts() {
        return this.prisma.product.findMany({
            where: { status: 'APPROVED' },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Admin: List All
    async getAllProducts() {
        return this.prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    // Add to Cart Logic
    async addToCart(userId: string, productId: string, quantity: number) {
        // 1. Ensure Cart Exists
        let cart = await this.prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            cart = await this.prisma.cart.create({ data: { userId } });
        }

        // 2. Check if item exists in cart
        const existingItem = await this.prisma.cartItem.findFirst({
            where: { cartId: cart.id, productId }
        });

        if (existingItem) {
            // Update quantity
            return this.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: { increment: quantity } }
            });
        } else {
            // Create new item
            return this.prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    quantity
                }
            });
        }
    }

    // User: Get My Orders
    async getUserOrders(userId: string) {
        return this.prisma.productOrder.findMany({
            where: { userId },
            include: { product: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Admin: Get All Orders
    async getAllOrders() {
        return this.prisma.productOrder.findMany({
            include: {
                product: true,
                user: {
                    select: { fullName: true, email: true, phone: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
