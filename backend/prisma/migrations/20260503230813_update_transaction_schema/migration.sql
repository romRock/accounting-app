/*
  Warnings:

  - You are about to drop the column `fromCityId` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `partyId` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `paymentType` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `referenceId` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `toCityId` on the `transactions` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `transactions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `commission` on the `transactions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - The `status` column on the `transactions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `amountType` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bookingCommission` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `centerCommission` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `centerId` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiverName` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderName` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `statusTime` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenNo` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_fromCityId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_partyId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_toCityId_fkey";

-- DropIndex
DROP INDEX "transactions_fromCityId_idx";

-- DropIndex
DROP INDEX "transactions_partyId_idx";

-- DropIndex
DROP INDEX "transactions_toCityId_idx";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "fromCityId",
DROP COLUMN "notes",
DROP COLUMN "partyId",
DROP COLUMN "paymentType",
DROP COLUMN "referenceId",
DROP COLUMN "toCityId",
ADD COLUMN     "amountType" TEXT NOT NULL,
ADD COLUMN     "autoCommission" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "bookingCommission" INTEGER NOT NULL,
ADD COLUMN     "centerCommission" INTEGER NOT NULL,
ADD COLUMN     "centerId" TEXT NOT NULL,
ADD COLUMN     "receiverClientId" TEXT,
ADD COLUMN     "receiverName" TEXT NOT NULL,
ADD COLUMN     "receiverNumber" TEXT,
ADD COLUMN     "remark" TEXT,
ADD COLUMN     "senderClientId" TEXT,
ADD COLUMN     "senderName" TEXT NOT NULL,
ADD COLUMN     "senderNumber" TEXT,
ADD COLUMN     "statusTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "tokenNo" INTEGER NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE INTEGER,
ALTER COLUMN "commission" SET DATA TYPE INTEGER,
DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "transactions_tokenNo_idx" ON "transactions"("tokenNo");

-- CreateIndex
CREATE INDEX "transactions_centerId_idx" ON "transactions"("centerId");

-- CreateIndex
CREATE INDEX "transactions_receiverClientId_idx" ON "transactions"("receiverClientId");

-- CreateIndex
CREATE INDEX "transactions_senderClientId_idx" ON "transactions"("senderClientId");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_receiverClientId_fkey" FOREIGN KEY ("receiverClientId") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_senderClientId_fkey" FOREIGN KEY ("senderClientId") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
