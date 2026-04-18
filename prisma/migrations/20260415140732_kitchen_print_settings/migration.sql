-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "kitchenPrintedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RestaurantSettings" ADD COLUMN     "kitchenPrintDelayMinutes" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "kitchenPrintEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "requireWaiterApprovalForKitchenPrint" BOOLEAN NOT NULL DEFAULT false;
