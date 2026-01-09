-- CreateTable
CREATE TABLE "KycSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "icImageUrl" TEXT NOT NULL,
    "selfieUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "reviewedBy" TEXT,
    CONSTRAINT "KycSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
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
    "totalReferralCommission" REAL NOT NULL DEFAULT 0.0,
    "currentMonthPersonalSales" REAL NOT NULL DEFAULT 0.0,
    "currentYearPersonalSales" REAL NOT NULL DEFAULT 0.0,
    CONSTRAINT "User_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("address", "createdAt", "currentMonthPersonalSales", "currentYearPersonalSales", "email", "fullName", "id", "isActive", "nextOfKinName", "nextOfKinPhone", "nextOfKinRelationship", "password", "phone", "role", "sponsorId", "totalReferralCommission", "updatedAt") SELECT "address", "createdAt", "currentMonthPersonalSales", "currentYearPersonalSales", "email", "fullName", "id", "isActive", "nextOfKinName", "nextOfKinPhone", "nextOfKinRelationship", "password", "phone", "role", "sponsorId", "totalReferralCommission", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "creditBalance" REAL NOT NULL DEFAULT 0.0,
    "bonusBalance" REAL NOT NULL DEFAULT 0.0,
    "rebateBalance" REAL NOT NULL DEFAULT 0.0,
    "goldBalance" REAL NOT NULL DEFAULT 0.0000,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Wallet" ("bonusBalance", "creditBalance", "goldBalance", "id", "rebateBalance", "updatedAt", "userId") SELECT "bonusBalance", "creditBalance", "goldBalance", "id", "rebateBalance", "updatedAt", "userId" FROM "Wallet";
DROP TABLE "Wallet";
ALTER TABLE "new_Wallet" RENAME TO "Wallet";
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "KycSubmission_userId_key" ON "KycSubmission"("userId");
