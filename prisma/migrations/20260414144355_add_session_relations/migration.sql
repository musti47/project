/*
  Warnings:

  - Added the required column `restaurantId` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('OPEN', 'CLOSED');

-- DropForeignKey
ALTER TABLE "Restaurant" DROP CONSTRAINT "Restaurant_tenantId_fkey";

-- AlterTable
ALTER TABLE "Restaurant" ALTER COLUMN "tenantId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "restaurantId" INTEGER NOT NULL,
ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "SessionStatus" NOT NULL DEFAULT 'OPEN';

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
