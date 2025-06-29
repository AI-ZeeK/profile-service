/*
  Warnings:

  - You are about to drop the `_PlatformUserToVerification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "platform"."_PlatformUserToVerification" DROP CONSTRAINT "_PlatformUserToVerification_A_fkey";

-- DropForeignKey
ALTER TABLE "platform"."_PlatformUserToVerification" DROP CONSTRAINT "_PlatformUserToVerification_B_fkey";

-- AlterTable
ALTER TABLE "profiles"."verifications" ADD COLUMN     "platform_user_id" UUID;

-- DropTable
DROP TABLE "platform"."_PlatformUserToVerification";

-- CreateTable
CREATE TABLE "platform"."platform_refs" (
    "platform_ref_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "platform_ref" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_refs_pkey" PRIMARY KEY ("platform_ref_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_refs_platform_ref_key" ON "platform"."platform_refs"("platform_ref");

-- AddForeignKey
ALTER TABLE "profiles"."verifications" ADD CONSTRAINT "verifications_platform_user_id_fkey" FOREIGN KEY ("platform_user_id") REFERENCES "platform"."platform_users"("platform_user_id") ON DELETE CASCADE ON UPDATE CASCADE;
