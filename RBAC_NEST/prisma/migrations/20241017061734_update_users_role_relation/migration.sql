-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "fk_role_id";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "fk_role_id" FOREIGN KEY ("role_id") REFERENCES "role"("role_id") ON DELETE SET NULL ON UPDATE CASCADE;
