-- CreateTable
CREATE TABLE "permission" (
    "id" BIGSERIAL NOT NULL,
    "profile_id" BIGINT NOT NULL,
    "action" VARCHAR NOT NULL,
    "subject" VARCHAR NOT NULL,
    "inverted" BOOLEAN NOT NULL DEFAULT false,
    "conditions" JSONB,
    "reason" VARCHAR,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "permission_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "role_name" VARCHAR(100),
    "role_id" BIGSERIAL NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" BIGSERIAL NOT NULL,
    "user_email" VARCHAR(100),
    "password" VARCHAR,
    "role_id" BIGINT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ix_unq_email" ON "users"("user_email");

-- AddForeignKey
ALTER TABLE "permission" ADD CONSTRAINT "fk_profile_id" FOREIGN KEY ("profile_id") REFERENCES "role"("role_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "fk_role_id" FOREIGN KEY ("role_id") REFERENCES "role"("role_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
