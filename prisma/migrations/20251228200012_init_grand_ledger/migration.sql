-- AlterTable
ALTER TABLE "SpecialFeeLog" ADD COLUMN "performedBy" TEXT;

-- CreateTable
CREATE TABLE "Supplier" (
    "supplierId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "contactInfo" TEXT
);

-- CreateTable
CREATE TABLE "GoldPurchaseLedger" (
    "purchaseId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "supplierId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weightGram" REAL NOT NULL,
    "costPerGram" REAL NOT NULL,
    "totalRM" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "GoldPurchaseLedger_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("supplierId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GoldStockMasterLedger" (
    "stockId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "refNo" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inGram" REAL NOT NULL DEFAULT 0.0,
    "outGram" REAL NOT NULL DEFAULT 0.0,
    "balanceGram" REAL NOT NULL DEFAULT 0.0,
    "costRM" REAL NOT NULL DEFAULT 0.0
);

-- CreateTable
CREATE TABLE "MemberGoldHoldingLedger" (
    "holdingId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refNo" TEXT NOT NULL,
    "inGram" REAL NOT NULL DEFAULT 0.0,
    "outGram" REAL NOT NULL DEFAULT 0.0,
    "balanceGram" REAL NOT NULL DEFAULT 0.0,
    CONSTRAINT "MemberGoldHoldingLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GoldSalesLedger" (
    "saleId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weightGram" REAL NOT NULL,
    "pricePerGram" REAL NOT NULL,
    "totalRM" REAL NOT NULL,
    "costRM" REAL NOT NULL,
    "grossProfit" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    CONSTRAINT "GoldSalesLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MemberCommissionLedger" (
    "commissionId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "fromUserId" TEXT,
    "refSales" TEXT,
    "month" TEXT NOT NULL,
    "amountRM" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    CONSTRAINT "MemberCommissionLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MemberCommissionLedger_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EKreditLedger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refNo" TEXT NOT NULL,
    "inRM" REAL NOT NULL DEFAULT 0.0,
    "outRM" REAL NOT NULL DEFAULT 0.0,
    "balanceRM" REAL NOT NULL DEFAULT 0.0,
    CONSTRAINT "EKreditLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EBonusLedger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "amountRM" REAL NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "EBonusLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ERebateLedger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "refPromo" TEXT,
    "amountRM" REAL NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "ERebateLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InternalTransferLedger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "fromAccount" TEXT NOT NULL,
    "toAccount" TEXT NOT NULL,
    "amountRM" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    CONSTRAINT "InternalTransferLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MembershipFeeLedger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amountRM" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MembershipFeeLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StorageFeeLedger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "amountRM" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StorageFeeLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OperatingCostLedger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "amountRM" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PostageHandlingLedger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "amountRM" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostageHandlingLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpecialFundLedger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "month" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "inRM" REAL NOT NULL DEFAULT 0.0,
    "outRM" REAL NOT NULL DEFAULT 0.0,
    "balanceRM" REAL NOT NULL DEFAULT 0.0
);

-- CreateTable
CREATE TABLE "EquityRetainedEarningsLedger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "initialCapital" REAL NOT NULL,
    "netProfit" REAL NOT NULL,
    "dividend" REAL NOT NULL,
    "balance" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "MonthlyEligibilityLedger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "savedGram" REAL NOT NULL,
    "isQualified" BOOLEAN NOT NULL,
    CONSTRAINT "MonthlyEligibilityLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockAdjustmentLedger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "refStock" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "gram" REAL NOT NULL,
    "note" TEXT
);

-- CreateTable
CREATE TABLE "ExceptionLogLedger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "userId" TEXT,
    "refNo" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "note" TEXT,
    CONSTRAINT "ExceptionLogLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MonthlySnapshotLedger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "month" TEXT NOT NULL,
    "physicalStock" REAL NOT NULL,
    "memberStock" REAL NOT NULL,
    "totalEKredit" REAL NOT NULL,
    "totalEBonus" REAL NOT NULL,
    "totalDanaKhas" REAL NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "adminStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "accountStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "nextOfKinName" TEXT,
    "nextOfKinPhone" TEXT,
    "nextOfKinRelationship" TEXT,
    "sponsorId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "kycStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "currentMonthPersonalSales" REAL NOT NULL DEFAULT 0.0,
    "currentYearPersonalSales" REAL NOT NULL DEFAULT 0.0,
    "totalReferralCommission" REAL NOT NULL DEFAULT 0.0,
    CONSTRAINT "User_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("address", "adminStatus", "createdAt", "currentMonthPersonalSales", "currentYearPersonalSales", "email", "fullName", "id", "isActive", "kycStatus", "nextOfKinName", "nextOfKinPhone", "nextOfKinRelationship", "password", "phone", "role", "sponsorId", "totalReferralCommission", "updatedAt") SELECT "address", "adminStatus", "createdAt", "currentMonthPersonalSales", "currentYearPersonalSales", "email", "fullName", "id", "isActive", "kycStatus", "nextOfKinName", "nextOfKinPhone", "nextOfKinRelationship", "password", "phone", "role", "sponsorId", "totalReferralCommission", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_memberId_key" ON "User"("memberId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
