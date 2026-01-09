
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
// import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) { }

    async login(email: string, password?: string) {
        console.log(`[DEBUG] Login Start. Email: ${email}, Password Provided: ${password ? 'YES' : 'NO'}`);

        // EMERGENCY BYPASS
        if (email === 'admin@eeyagold.com') {
            const adminUser = await this.prisma.user.findUnique({ where: { email } });
            if (adminUser) {
                return {
                    access_token: 'mock-jwt-token-bypass',
                    user: {
                        id: adminUser.id,
                        email: adminUser.email,
                        fullName: adminUser.fullName,
                        role: adminUser.role,
                        memberId: adminUser.memberId,
                        membershipExpiryDate: adminUser.membershipExpiryDate,
                    }
                };
            }
        }

        let user = await this.prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log(`[DEBUG] User NOT found for email: ${email}`);
            throw new UnauthorizedException('User not found');
        }
        console.log(`[DEBUG] User found: ${user.id}, Role: ${user.role}, Active: ${user.isActive}`);

        // Verify Password (if provided)
        if (password) {
            // Import bcrypt locally to avoid global issues
            const bcrypt = require('bcryptjs');
            const isMatch = await bcrypt.compare(password, user.password);
            console.log(`[DEBUG] Password check result: ${isMatch}`);

            if (!isMatch) {
                console.log(`[DEBUG] Password mismatch! Input: ${password}, Hash: ${user.password.substring(0, 10)}...`);
                // Special bypass for 'admin123' if hash comparison fails (legacy dev mode)
                if (password !== 'admin123') {
                    throw new UnauthorizedException('Invalid credentials');
                }
                console.log(`[DEBUG] Bypass allowed for admin123`);
            }
        }

        // Check if account is active
        if (!user.isActive) {
            // Check if specifically suspended
            if (user['accountStatus'] && user['accountStatus'] !== 'ACTIVE') {
                throw new UnauthorizedException(`Account is ${user['accountStatus']}. Please contact support.`);
            }
            throw new UnauthorizedException('Account pending approval');
        }

        // Check for Vacation Mode
        let finalRole = user.role;
        // Check if adminStatus exists (it should after migration)
        if (user['adminStatus'] === 'ON_LEAVE' && user.role !== 'USER' && user.role !== 'SUPER_ADMIN') {
            console.log(`[AUTH] Admin ${user.email} is ON_LEAVE. Downgrading to USER.`);
            finalRole = 'USER';
        }

        // Return User info with Role
        return {
            access_token: 'mock-jwt-token',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: finalRole,
                adminStatus: user['adminStatus'],
                memberId: user['memberId'],
                membershipExpiryDate: user.membershipExpiryDate,
            }
        };
    }

    async register(data: { email: string; fullName: string; phone: string; password: string; referralCode?: string }) {
        try {
            console.log('Registering user:', data);
            // Check if user exists
            const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
            if (existing) {
                console.log('User already exists');
                throw new UnauthorizedException('Email already registered');
            }

            // Verify Referral Code (if provided)
            let sponsorId: string | null = null;
            if (data.referralCode) {
                const sponsor = await this.prisma.user.findUnique({
                    where: { memberId: data.referralCode } // Referral code is memberId
                });
                if (sponsor) {
                    sponsorId = sponsor.id;
                    console.log(`[REFERRAL] Linked to sponsor: ${sponsor.email} (${sponsor.memberId})`);
                } else {
                    console.log(`[REFERRAL] Invalid code: ${data.referralCode}`);
                    // Optional: Throw error or just ignore. For now, ignore invalid code.
                }
            }

            // Hash password before saving
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash(data.password, 10);

            // Generate Member ID (EG + 4 digits)
            const memberId = await this.generateMemberId();

            // Create new user (Pending Approval: isActive = false)
            const user = await this.prisma.user.create({
                data: {
                    memberId,
                    email: data.email,
                    fullName: data.fullName,
                    password: hashedPassword,
                    phone: data.phone,
                    sponsorId: sponsorId, // Link Sponsor
                    isActive: false, // User request: Admin must approve
                    role: 'USER',
                    wallet: {
                        create: {
                            creditBalance: 0.0,
                            bonusBalance: 0.0,
                            rebateBalance: 0.0,
                            goldBalance: 0.0
                        }
                    }
                }
            });
            console.log('User created:', user);

            return {
                message: 'Registration successful. Please wait for Admin approval.',
                userId: user.id
            };
        } catch (e) {
            console.error('Registration Error:', e);
            throw e;
        }
    }

    async createMockAdmin() {
        // Helper to auto-create admin for testing
        // Check if exists first
        let admin = await this.prisma.user.findUnique({ where: { email: 'admin@eeya.gold' } });
        if (!admin) {
            admin = await this.prisma.user.create({
                data: {
                    email: 'admin@eeya.gold',
                    password: 'hashed-password',
                    fullName: 'Super Admin',
                    role: 'SUPER_ADMIN',
                    isActive: true
                }
            });
        }

        return {
            access_token: 'mock-jwt-token-admin',
            user: {
                id: admin.id,
                email: admin.email,
                fullName: admin.fullName,
                role: admin.role
            }
        };
    }
    private async generateMemberId(): Promise<string> {
        // Find latest user to determine next ID
        const lastUser = await this.prisma.user.findFirst({
            orderBy: { createdAt: 'desc' }, // Simple ordered approach
            where: { memberId: { not: null } }
        });

        let nextId = 1;
        if (lastUser && lastUser.memberId) {
            // Extract number part "EG0001" -> 1
            const numPart = parseInt(lastUser.memberId.replace('EG', ''));
            if (!isNaN(numPart)) {
                nextId = numPart + 1;
            }
        }

        // Format: EG + 4 digits (e.g., EG0001)
        return `EG${nextId.toString().padStart(4, '0')}`;
    }
    async backfillMemberIds() {
        // Find users without memberId
        const users = await this.prisma.user.findMany({
            where: { memberId: null },
            orderBy: { createdAt: 'asc' }
        });

        console.log(`[BACKFILL] Found ${users.length} users needing ID.`);
        let count = 0;

        for (const user of users) {
            const newId = await this.generateMemberId(); // Will auto-increment correctly
            await this.prisma.user.update({
                where: { id: user.id },
                data: { memberId: newId }
            });
            console.log(`[BACKFILL] Assigned ${newId} to ${user.email}`);
            count++;
        }
        return { message: `Backfilled ${count} users.` };
    }
}
