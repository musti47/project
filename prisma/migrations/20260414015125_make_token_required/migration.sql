/*
  Warnings:

  - Made the column `token` on table `Table` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Table" ALTER COLUMN "token" SET NOT NULL;
