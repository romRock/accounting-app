-- CreateTable
CREATE TABLE "user_branches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_branches_userId_branchId_key" ON "user_branches"("userId", "branchId");

-- CreateIndex
CREATE INDEX "user_branches_userId_idx" ON "user_branches"("userId");

-- CreateIndex
CREATE INDEX "user_branches_branchId_idx" ON "user_branches"("branchId");

-- AddForeignKey
ALTER TABLE "user_branches" ADD CONSTRAINT "user_branches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_branches" ADD CONSTRAINT "user_branches_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill from existing users.branchId
INSERT INTO "user_branches" ("id", "userId", "branchId", "createdAt")
SELECT
    gen_random_uuid()::text,
    u."id",
    u."branchId",
    NOW()
FROM "users" u
WHERE u."branchId" IS NOT NULL
ON CONFLICT ("userId", "branchId") DO NOTHING;
