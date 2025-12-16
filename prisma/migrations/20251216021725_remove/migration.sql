/*
  Warnings:

  - You are about to drop the `business_user_roles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "roles"."business_user_roles" DROP CONSTRAINT "business_user_roles_business_user_id_fkey";

-- DropTable
DROP TABLE "roles"."business_user_roles";
