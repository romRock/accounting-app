-- Create missing accounting tables and add missing ledger relation

-- Create account_categories table
CREATE TABLE "account_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "gstApplicable" BOOLEAN NOT NULL DEFAULT false,
    "tdsApplicable" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "account_categories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "account_categories_type_idx" ON "account_categories"("type");
CREATE INDEX "account_categories_parentId_idx" ON "account_categories"("parentId");
CREATE INDEX "account_categories_createdAt_idx" ON "account_categories"("createdAt");

-- Create account_entries table
CREATE TABLE "account_entries" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "partyId" TEXT,
    "paymentMethod" TEXT,
    "referenceNo" TEXT,
    "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tdsAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "statusTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "branchId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "account_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "account_entries_entryId_key" ON "account_entries"("entryId");
CREATE INDEX "account_entries_date_idx" ON "account_entries"("date");
CREATE INDEX "account_entries_categoryId_idx" ON "account_entries"("categoryId");
CREATE INDEX "account_entries_partyId_idx" ON "account_entries"("partyId");
CREATE INDEX "account_entries_type_idx" ON "account_entries"("type");
CREATE INDEX "account_entries_branchId_idx" ON "account_entries"("branchId");
CREATE INDEX "account_entries_createdBy_idx" ON "account_entries"("createdBy");
CREATE INDEX "account_entries_createdAt_idx" ON "account_entries"("createdAt");

-- Create client_ledgers table
CREATE TABLE "client_ledgers" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastTransactionDate" TIMESTAMP(3),
    "balanceType" TEXT NOT NULL DEFAULT 'DEBIT',
    "financialYear" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "client_ledgers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "client_ledgers_clientId_key" ON "client_ledgers"("clientId");
CREATE INDEX "client_ledgers_balanceType_idx" ON "client_ledgers"("balanceType");
CREATE INDEX "client_ledgers_financialYear_idx" ON "client_ledgers"("financialYear");
CREATE INDEX "client_ledgers_createdAt_idx" ON "client_ledgers"("createdAt");

-- Alter ledger_entries to add missing accountEntryId relation
ALTER TABLE "ledger_entries"
    ADD COLUMN "accountEntryId" TEXT;

CREATE INDEX "ledger_entries_accountEntryId_idx" ON "ledger_entries"("accountEntryId");

-- Add foreign keys for accounting relations
ALTER TABLE "account_categories"
    ADD CONSTRAINT "account_categories_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "account_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "account_entries"
    ADD CONSTRAINT "account_entries_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "account_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "account_entries"
    ADD CONSTRAINT "account_entries_partyId_fkey"
    FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "account_entries"
    ADD CONSTRAINT "account_entries_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "account_entries"
    ADD CONSTRAINT "account_entries_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "client_ledgers"
    ADD CONSTRAINT "client_ledgers_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "client_ledgers"
    ADD CONSTRAINT "client_ledgers_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ledger_entries"
    ADD CONSTRAINT "ledger_entries_accountEntryId_fkey"
    FOREIGN KEY ("accountEntryId") REFERENCES "account_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
