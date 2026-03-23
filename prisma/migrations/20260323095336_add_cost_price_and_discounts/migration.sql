-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "DiscountTarget" AS ENUM ('ALL', 'CATEGORY', 'PRODUCT');

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "costPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "costPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Discount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "target" "DiscountTarget" NOT NULL,
    "categoryId" TEXT,
    "productId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
