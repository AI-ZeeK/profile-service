/*
  Warnings:

  - You are about to drop the column `actioned_at` on the `staff_invitations` table. All the data in the column will be lost.
  - You are about to drop the column `invited_by` on the `staff_invitations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "profiles"."staff_invitations" DROP COLUMN "actioned_at",
DROP COLUMN "invited_by",
ADD COLUMN     "invited_by_user_id" UUID,
ADD COLUMN     "responsed_at" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "profiles"."staff_invitations" ADD CONSTRAINT "staff_invitations_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "profiles"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
