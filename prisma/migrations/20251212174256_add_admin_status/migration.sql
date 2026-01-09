-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "adminStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
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
INSERT INTO "new_User" ("address", "createdAt", "currentMonthPersonalSales", "currentYearPersonalSales", "email", "fullName", "id", "isActive", "kycStatus", "nextOfKinName", "nextOfKinPhone", "nextOfKinRelationship", "password", "phone", "role", "sponsorId", "totalReferralCommission", "updatedAt") SELECT "address", "createdAt", "currentMonthPersonalSales", "currentYearPersonalSales", "email", "fullName", "id", "isActive", "kycStatus", "nextOfKinName", "nextOfKinPhone", "nextOfKinRelationship", "password", "phone", "role", "sponsorId", "totalReferralCommission", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
