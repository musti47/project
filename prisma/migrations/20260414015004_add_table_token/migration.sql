/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `Table` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Table_token_key" ON "Table"("token");
