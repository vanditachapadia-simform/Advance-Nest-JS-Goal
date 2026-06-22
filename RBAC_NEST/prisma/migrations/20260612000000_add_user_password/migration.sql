-- AlterTable: add hashed password column to users
ALTER TABLE "users" ADD COLUMN "user_password" VARCHAR(255);
