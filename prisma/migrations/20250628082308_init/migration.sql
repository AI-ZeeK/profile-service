/*
  Warnings:

  - You are about to drop the `platform_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `platform_role_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `platform_roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `platform_staff` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "platform"."platform_role_permissions" DROP CONSTRAINT "platform_role_permissions_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "platform"."platform_role_permissions" DROP CONSTRAINT "platform_role_permissions_role_id_fkey";

-- DropForeignKey
ALTER TABLE "platform"."platform_staff" DROP CONSTRAINT "platform_staff_role_id_fkey";

-- DropForeignKey
ALTER TABLE "platform"."platform_staff" DROP CONSTRAINT "platform_staff_user_id_fkey";

-- DropTable
DROP TABLE "platform"."platform_permissions";

-- DropTable
DROP TABLE "platform"."platform_role_permissions";

-- DropTable
DROP TABLE "platform"."platform_roles";

-- DropTable
DROP TABLE "platform"."platform_staff";

-- CreateTable
CREATE TABLE "platform"."platform_users" (
    "platform_user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" VARCHAR(50),
    "last_name" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "platform_users_pkey" PRIMARY KEY ("platform_user_id")
);

-- CreateTable
CREATE TABLE "platform"."_PlatformUserToVerification" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_users_email_key" ON "platform"."platform_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_PlatformUserToVerification_AB_unique" ON "platform"."_PlatformUserToVerification"("A", "B");

-- CreateIndex
CREATE INDEX "_PlatformUserToVerification_B_index" ON "platform"."_PlatformUserToVerification"("B");

-- AddForeignKey
ALTER TABLE "platform"."platform_users" ADD CONSTRAINT "platform_users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"."roles"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."_PlatformUserToVerification" ADD CONSTRAINT "_PlatformUserToVerification_A_fkey" FOREIGN KEY ("A") REFERENCES "platform"."platform_users"("platform_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."_PlatformUserToVerification" ADD CONSTRAINT "_PlatformUserToVerification_B_fkey" FOREIGN KEY ("B") REFERENCES "profiles"."verifications"("verification_id") ON DELETE CASCADE ON UPDATE CASCADE;
