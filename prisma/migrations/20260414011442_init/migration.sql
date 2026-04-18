/*
  Warnings:

  - You are about to drop the column `price` on the `MenuItem` table. All the data in the column will be lost.
  - The `status` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[restaurantId,number]` on the table `Table` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `MenuCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceAmount` to the `MenuItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `MenuItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `restaurantId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lineTotalAmount` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameSnapshot` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPriceAmount` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Restaurant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Restaurant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Table` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE_CARD', 'NFC_CARD', 'CASH', 'POS', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentSplitType" AS ENUM ('FULL', 'EQUAL_SPLIT', 'ITEM_BASED', 'CUSTOM_AMOUNT');

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_sessionId_fkey";

-- AlterTable
ALTER TABLE "MenuCategory" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "MenuItem" DROP COLUMN "price",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "priceAmount" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "restaurantId" INTEGER NOT NULL,
ADD COLUMN     "totalAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "sessionId" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lineTotalAmount" INTEGER NOT NULL,
ADD COLUMN     "nameSnapshot" TEXT NOT NULL,
ADD COLUMN     "unitPriceAmount" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tenantId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Tenant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "tableId" INTEGER NOT NULL,
    "sessionId" TEXT,
    "provider" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "splitType" "PaymentSplitType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" SERIAL NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "orderItemId" INTEGER,
    "allocatedAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" SERIAL NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "providerEventId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerPaymentId_key" ON "Payment"("providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_paymentId_eventType_providerEventId_key" ON "PaymentEvent"("paymentId", "eventType", "providerEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Table_restaurantId_number_key" ON "Table"("restaurantId", "number");

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
