-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'DIRTY');

-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE';
