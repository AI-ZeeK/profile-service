/*
  Warnings:

  - A unique constraint covering the columns `[user_id,source]` on the table `user_sessions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_user_id_source_key" ON "profiles"."user_sessions"("user_id", "source");
