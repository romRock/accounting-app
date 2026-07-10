-- City code uniqueness is per branch, not global.
-- Allows the same center code/name in different branches as separate records.

DROP INDEX IF EXISTS "cities_code_key";
ALTER TABLE "cities" DROP CONSTRAINT IF EXISTS "cities_code_key";

CREATE UNIQUE INDEX IF NOT EXISTS "cities_code_branchId_key" ON "cities"("code", "branchId");
