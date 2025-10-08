/*
  Warnings:

  - You are about to drop the column `platform_user_id` on the `verifications` table. All the data in the column will be lost.
  - You are about to drop the `platform_refs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `platform_users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "platform"."platform_users" DROP CONSTRAINT "platform_users_role_id_fkey";

-- DropForeignKey
ALTER TABLE "profiles"."verifications" DROP CONSTRAINT "verifications_platform_user_id_fkey";

-- AlterTable
ALTER TABLE "profiles"."verifications" DROP COLUMN "platform_user_id";

-- DropTable
DROP TABLE "platform"."platform_refs";

-- DropTable
DROP TABLE "platform"."platform_users";
