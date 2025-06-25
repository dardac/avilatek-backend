-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");
