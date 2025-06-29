-- AlterTable
ALTER TABLE "platform"."platform_users" ADD COLUMN     "is_blocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "refresh_token" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "profiles"."verifications" ALTER COLUMN "user_id" DROP NOT NULL;
