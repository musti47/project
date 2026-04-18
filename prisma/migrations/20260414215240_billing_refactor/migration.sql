/*
  Warnings:

  - The values [NFC_CARD,OTHER] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - The values [FULL] on the enum `PaymentSplitType` will be removed. If these variants are still used in the database, this will fail.
  - The values [PROCESSING,EXPIRED,REFUNDED] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `tenantId` on the `Restaurant` table. All the data in the column will be lost.
  - You are about to drop the `Tenant` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[externalProvider,externalOrderId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - Made the column `orderItemId` on table `PaymentAllocation` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "BillingMode" AS ENUM ('NORMAL', 'SPLIT_ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('QR', 'IN_STORE', 'GETIR', 'TRENDYOL', 'YEMEKSEPETI');

-- CreateEnum
CREATE TYPE "SplitPlanType" AS ENUM ('EQUAL');

-- CreateEnum
CREATE TYPE "SplitPlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SplitShareStatus" AS ENUM ('PENDING', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "KitchenTicketStatus" AS ENUM ('PENDING', 'PRINTED', 'ACKNOWLEDGED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "KitchenTicketItemStatus" AS ENUM ('PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('ONLINE_CARD', 'CASH', 'POS');
ALTER TABLE "Payment" ALTER COLUMN "method" TYPE "PaymentMethod_new" USING ("method"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentSplitType_new" AS ENUM ('NONE', 'CUSTOM_AMOUNT', 'EQUAL_SPLIT', 'ITEM_BASED', 'SETTLEMENT');
ALTER TABLE "Payment" ALTER COLUMN "splitType" TYPE "PaymentSplitType_new" USING ("splitType"::text::"PaymentSplitType_new");
ALTER TYPE "PaymentSplitType" RENAME TO "PaymentSplitType_old";
ALTER TYPE "PaymentSplitType_new" RENAME TO "PaymentSplitType";
DROP TYPE "public"."PaymentSplitType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'VOID');
ALTER TABLE "public"."Payment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Payment" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "Payment" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentAllocation" DROP CONSTRAINT "PaymentAllocation_orderItemId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentAllocation" DROP CONSTRAINT "PaymentAllocation_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentEvent" DROP CONSTRAINT "PaymentEvent_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "Restaurant" DROP CONSTRAINT "Restaurant_tenantId_fkey";

-- DropIndex
DROP INDEX "PaymentEvent_paymentId_eventType_providerEventId_key";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "externalOrderId" TEXT,
ADD COLUMN     "externalProvider" TEXT,
ADD COLUMN     "source" "OrderSource" NOT NULL DEFAULT 'QR';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "splitPlanId" INTEGER;

-- AlterTable
ALTER TABLE "PaymentAllocation" ALTER COLUMN "orderItemId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Restaurant" DROP COLUMN "tenantId";

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "billingMode" "BillingMode" NOT NULL DEFAULT 'NORMAL';

-- DropTable
DROP TABLE "Tenant";

-- CreateTable
CREATE TABLE "SplitPlan" (
    "id" SERIAL NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "tableId" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "SplitPlanType" NOT NULL,
    "status" "SplitPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "personCount" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "remainingAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SplitPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitShare" (
    "id" SERIAL NOT NULL,
    "splitPlanId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "remaining" INTEGER NOT NULL,
    "status" "SplitShareStatus" NOT NULL DEFAULT 'PENDING',
    "paidByPaymentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SplitShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitchenTicket" (
    "id" SERIAL NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "tableId" INTEGER,
    "sessionId" TEXT,
    "orderId" INTEGER,
    "source" "OrderSource" NOT NULL DEFAULT 'QR',
    "status" "KitchenTicketStatus" NOT NULL DEFAULT 'PENDING',
    "printedAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitchenTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitchenTicketItem" (
    "id" SERIAL NOT NULL,
    "kitchenTicketId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "orderItemId" INTEGER NOT NULL,
    "nameSnapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "KitchenTicketItemStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitchenTicketItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_externalProvider_externalOrderId_key" ON "Order"("externalProvider", "externalOrderId");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_splitPlanId_fkey" FOREIGN KEY ("splitPlanId") REFERENCES "SplitPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitPlan" ADD CONSTRAINT "SplitPlan_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitPlan" ADD CONSTRAINT "SplitPlan_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitPlan" ADD CONSTRAINT "SplitPlan_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitShare" ADD CONSTRAINT "SplitShare_splitPlanId_fkey" FOREIGN KEY ("splitPlanId") REFERENCES "SplitPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitShare" ADD CONSTRAINT "SplitShare_paidByPaymentId_fkey" FOREIGN KEY ("paidByPaymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenTicket" ADD CONSTRAINT "KitchenTicket_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenTicket" ADD CONSTRAINT "KitchenTicket_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenTicket" ADD CONSTRAINT "KitchenTicket_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenTicketItem" ADD CONSTRAINT "KitchenTicketItem_kitchenTicketId_fkey" FOREIGN KEY ("kitchenTicketId") REFERENCES "KitchenTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenTicketItem" ADD CONSTRAINT "KitchenTicketItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenTicketItem" ADD CONSTRAINT "KitchenTicketItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
