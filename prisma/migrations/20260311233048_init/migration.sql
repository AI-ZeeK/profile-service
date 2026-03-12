/*
  Warnings:

  - A unique constraint covering the columns `[user_id,company_id]` on the table `business_users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "profiles"."business_users" ADD COLUMN     "company_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "business_users_user_id_company_id_key" ON "profiles"."business_users"("user_id", "company_id");
