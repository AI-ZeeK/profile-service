/*
  Warnings:

  - You are about to drop the column `refresh_token` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "profiles"."SessionSource" AS ENUM ('WEB', 'MOBILE', 'TABLET', 'OTHER');

-- AlterTable
ALTER TABLE "profiles"."users" DROP COLUMN "refresh_token",
ADD COLUMN     "last_login" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "profiles"."user_sessions" (
    "session_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "source" "profiles"."SessionSource" NOT NULL DEFAULT 'WEB',
    "device_info" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "login_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "profiles"."user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_is_active_idx" ON "profiles"."user_sessions"("is_active");

-- CreateIndex
CREATE INDEX "idx_users_user_id" ON "profiles"."users"("user_id");

-- CreateIndex
CREATE INDEX "idx_users_last_login" ON "profiles"."users"("last_login");

-- AddForeignKey
ALTER TABLE "profiles"."user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
