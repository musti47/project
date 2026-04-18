/*
  Warnings:

  - Added the required column `categoryId` to the `MenuItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "categoryId" INTEGER NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "MenuCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "restaurantId" INTEGER NOT NULL,

    CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MenuCategory" ADD CONSTRAINT "MenuCategory_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
