/*
  Warnings:

  - You are about to drop the column `profile_id` on the `permission` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - Added the required column `role_id` to the `permission` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "permission" DROP CONSTRAINT "fk_profile_id";

-- AlterTable
ALTER TABLE "permission" DROP COLUMN "profile_id",
ADD COLUMN     "role_id" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "password";

-- AddForeignKey
ALTER TABLE "permission" ADD CONSTRAINT "fk_profile_id" FOREIGN KEY ("role_id") REFERENCES "role"("role_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
