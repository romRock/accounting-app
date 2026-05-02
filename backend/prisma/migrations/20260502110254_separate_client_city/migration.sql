/*
  Warnings:

  - You are about to drop the column `cityId` on the `parties` table. All the data in the column will be lost.
  - You are about to drop the `Client` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "parties" DROP CONSTRAINT "parties_cityId_fkey";

-- DropIndex
DROP INDEX "parties_cityId_idx";

-- AlterTable
ALTER TABLE "parties" DROP COLUMN "cityId",
ADD COLUMN     "city" TEXT;

-- DropTable
DROP TABLE "Client";

-- CreateIndex
CREATE INDEX "parties_city_idx" ON "parties"("city");
