-- DropForeignKey
ALTER TABLE "permission" DROP CONSTRAINT "fk_profile_id";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "fk_role_id";

-- AlterTable: Changing ID and Foreign Key Columns
ALTER TABLE "permission" 
DROP CONSTRAINT "permission_pk",
ALTER COLUMN "id" TYPE INTEGER USING id::INTEGER,
ALTER COLUMN "role_id" TYPE INTEGER USING role_id::INTEGER,
ADD CONSTRAINT "permission_pk" PRIMARY KEY ("id");

ALTER TABLE "role"
DROP CONSTRAINT "profiles_pkey",
ALTER COLUMN "role_id" TYPE INTEGER USING role_id::INTEGER,
ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("role_id");

ALTER TABLE "users"
DROP CONSTRAINT "users_pkey",
ALTER COLUMN "user_id" TYPE INTEGER USING user_id::INTEGER,
ALTER COLUMN "role_id" TYPE INTEGER USING role_id::INTEGER,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");

-- AddForeignKey
ALTER TABLE "permission" 
ADD CONSTRAINT "fk_profile_id" FOREIGN KEY ("role_id") REFERENCES "role"("role_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" 
ADD CONSTRAINT "fk_role_id" FOREIGN KEY ("role_id") REFERENCES "role"("role_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
