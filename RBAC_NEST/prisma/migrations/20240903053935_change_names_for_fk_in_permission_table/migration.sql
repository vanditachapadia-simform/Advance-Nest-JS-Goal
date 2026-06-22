-- AlterTable
ALTER TABLE "role" RENAME CONSTRAINT "profiles_pkey" TO "role_pkey";

-- RenameForeignKey
ALTER TABLE "permission" RENAME CONSTRAINT "fk_profile_id" TO "fk_role_id";
