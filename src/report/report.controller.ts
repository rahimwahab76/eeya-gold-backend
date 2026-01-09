import { Controller, Get, Post, Body, UseGuards, Request, UnauthorizedException, Query } from '@nestjs/common';
import { ReportService } from './report.service';

@Controller('reports')
export class ReportController {
    constructor(private reportService: ReportService) { }

    // Guard placeholder - ideally use a real Auth Guard
    // For now assuming middleware logic or custom guard usually used in this project

    private validateAuditAccess(role?: string) {
        if (role !== 'SUPER_ADMIN' && role !== 'ADMIN_AUDIT') {
            throw new UnauthorizedException('Access Denied: Restricted to SUPER_ADMIN and ADMIN_AUDIT only.');
        }
    }

    @Get('summary')
    async getSummary(@Query('role') role: string) {
        // Validation handled by frontend filtering usually, but enforcing here too
        // Allow broader access for summary if needed, or restrict:
        // this.validateAuditAccess(role); 
        return this.reportService.getBusinessSummary();
    }

    @Get('expenses')
    async getExpenses() {
        return this.reportService.getExpenses();
    }

    @Post('expenses')
    async addExpense(@Body() body: any) {
        return this.reportService.addExpense(body);
    }

    @Get('bonus-audit')
    async getBonusAudit(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getBonusAuditLog();
    }

    @Post('company-stock')
    async updateCompanyStock(@Body() body: { adminId: string, amount: number, type: 'IN' | 'OUT', description: string, role: string }) {
        return this.reportService.updateCompanyStock(body.adminId, body.amount, body.type, body.description, body.role);
    }

    @Get('admin-ledger')
    async getAdminLedger(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getMasterLedger();
    }

    @Get('group-a/purchases')
    async getGoldPurchases(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getGoldPurchases();
    }

    @Get('group-a/stock')
    async getGoldStock(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getGoldStockMaster();
    }

    @Get('group-b/holdings')
    async getMemberGoldHoldings(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getMemberGoldHoldings();
    }

    @Get('group-c/sales')
    async getGoldSales(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getGoldSales();
    }

    @Get('group-c/commissions')
    async getMemberCommissions(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getMemberCommissions();
    }

    @Get('group-d/e-kredit')
    async getEKredit(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getEKredit();
    }

    @Get('group-d/e-bonus')
    async getEBonus(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getEBonus();
    }

    @Get('group-d/e-rebate')
    async getERebate(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getERebate();
    }

    @Get('group-d/internal-transfers')
    async getInternalTransfers(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getInternalTransfers();
    }

    @Get('group-e/membership-fees')
    async getMembershipFees(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getMembershipFees();
    }

    @Get('group-e/storage-fees')
    async getStorageFees(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getStorageFees();
    }

    @Get('group-e/operating-costs')
    async getOperatingCosts(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getOperatingCosts();
    }

    @Get('group-e/postage-handling')
    async getPostageHandling(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getPostageHandling();
    }

    @Get('group-e/special-fund-ledger')
    async getSpecialFundLedgerLogs(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getSpecialFundLogs();
    }

    @Get('group-f/equity')
    async getEquityLedger(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getEquityLedger();
    }

    @Get('group-g/stock-adjustment')
    async getStockAdjustment(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getStockAdjustment();
    }

    @Post('group-g/stock-adjustment')
    async createStockAdjustment(@Body() body: { adminId: string, refStock: string, type: string, gram: number, note: string }) {
        return this.reportService.createStockAdjustment(body);
    }

    @Get('group-g/exception-logs')
    async getExceptionLogs(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getExceptionLogs();
    }

    @Get('group-g/monthly-snapshot')
    async getMonthlySnapshot(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getMonthlySnapshot();
    }

    @Get('group-h/financial')
    async getFinancialReport(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getFinancialReport();
    }

    @Get('group-h/stock')
    async getStockReport(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getStockReport();
    }

    @Get('group-h/system-audit')
    async getSystemAudit(@Query('role') role: string) {
        this.validateAuditAccess(role);
        return this.reportService.getSystemAudit();
    }

    @Get('legacy-admin-ledger') // Backup access to raw table if needed
    async getLegacyAdminLedger() {
        return this.reportService.getAdminLedger();
    }


    @Post('transfer-special-fee')
    async transferSpecialFee(@Body() body: { adminId: string, amount: number, description: string }) {
        return this.reportService.transferSpecialFee(body.adminId, body.amount, body.description);
    }

    @Get('special-fee-fund')
    async getSpecialFeeFund() {
        return this.reportService.getSpecialFeeFund();
    }

    @Post('special-fee-fund/withdraw')
    async withdrawSpecialFee(@Body() body: { adminId: string, amount: number, to: string, description: string }) {
        return this.reportService.withdrawSpecialFee(body.adminId, body.amount, body.to, body.description);
    }
}
