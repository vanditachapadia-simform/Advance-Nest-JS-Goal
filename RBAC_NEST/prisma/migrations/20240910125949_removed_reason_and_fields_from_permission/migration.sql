/*
  Warnings:

  - You are about to drop the column `fields` on the `permission` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `permission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "permission" DROP COLUMN "fields",
DROP COLUMN "reason";
