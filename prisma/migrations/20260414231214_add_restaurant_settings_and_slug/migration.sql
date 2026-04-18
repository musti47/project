/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Restaurant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "slug" TEXT;

-- CreateTable
CREATE TABLE "RestaurantSettings" (
    "id" SERIAL NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "splitEnabled" BOOLEAN NOT NULL DEFAULT true,
    "manualCashEnabled" BOOLEAN NOT NULL DEFAULT true,
    "manualPosEnabled" BOOLEAN NOT NULL DEFAULT true,
    "customerCustomAmountEnabled" BOOLEAN NOT NULL DEFAULT true,
    "fullSettlementEnabled" BOOLEAN NOT NULL DEFAULT true,
    "waiterCustomAmountEnabled" BOOLEAN NOT NULL DEFAULT true,
    "billRequestEnabled" BOOLEAN NOT NULL DEFAULT true,
    "kitchenTicketEnabled" BOOLEAN NOT NULL DEFAULT true,
    "bulkApproveEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cleaningFlowEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantSettings_restaurantId_key" ON "RestaurantSettings"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_slug_key" ON "Restaurant"("slug");

-- AddForeignKey
ALTER TABLE "RestaurantSettings" ADD CONSTRAINT "RestaurantSettings_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
