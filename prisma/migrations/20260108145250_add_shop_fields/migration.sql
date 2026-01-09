-- AlterTable
ALTER TABLE "GoldPrice" ADD COLUMN "buy916" REAL DEFAULT 0.0;
ALTER TABLE "GoldPrice" ADD COLUMN "sell916" REAL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "OperatingCostLedger" ADD COLUMN "description" TEXT;
ALTER TABLE "OperatingCostLedger" ADD COLUMN "recordedBy" TEXT;

-- CreateTable
CREATE TABLE "ProductOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "priceAtPurchase" REAL NOT NULL,
    "workmanship" REAL NOT NULL,
    "shippingCost" REAL NOT NULL,
    "totalPaid" REAL NOT NULL,
    "weight" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageUrl" TEXT NOT NULL,
    "title" TEXT,
    "linkUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'profile-1',
    "termsContent" TEXT,
    "disclaimer" TEXT,
    "directorName" TEXT,
    "directorBio" TEXT,
    "directorImageUrl" TEXT,
    "companyName" TEXT,
    "companyDescription" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "weight" REAL NOT NULL,
    "purity" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "shippingCost" REAL NOT NULL DEFAULT 0.0,
    "workmanship" REAL NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("createdAt", "createdBy", "description", "id", "imageUrl", "name", "price", "purity", "status", "updatedAt", "weight") SELECT "createdAt", "createdBy", "description", "id", "imageUrl", "name", "price", "purity", "status", "updatedAt", "weight" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
