-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GoldPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotPrice" REAL NOT NULL DEFAULT 0.0,
    "buy" REAL NOT NULL,
    "sell" REAL NOT NULL,
    "buy916" REAL DEFAULT 0.0,
    "sell916" REAL DEFAULT 0.0,
    "sellSpread" REAL NOT NULL DEFAULT 8.3,
    "buySpread" REAL NOT NULL DEFAULT 5.0,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_GoldPrice" ("buy", "buy916", "id", "sell", "sell916", "timestamp") SELECT "buy", "buy916", "id", "sell", "sell916", "timestamp" FROM "GoldPrice";
DROP TABLE "GoldPrice";
ALTER TABLE "new_GoldPrice" RENAME TO "GoldPrice";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
