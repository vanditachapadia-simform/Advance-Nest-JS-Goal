-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "managerId" TEXT;

-- CreateIndex
CREATE INDEX "employees_managerId_idx" ON "employees"("managerId");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
