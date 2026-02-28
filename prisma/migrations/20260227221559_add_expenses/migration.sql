/*
  Warnings:

  - You are about to drop the column `title` on the `Expense` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Expense` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - Added the required column `category` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `Expense` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('ADVERTISING', 'PHOTOGRAPHER', 'DELIVERY', 'SALARY', 'DISCOUNT_LOSS', 'PURCHASE', 'BANK_FEE', 'OTHER');

-- AlterTable
ALTER TABLE "Expense" DROP COLUMN "title",
ADD COLUMN     "category" "ExpenseCategory" NOT NULL,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "description" TEXT,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
