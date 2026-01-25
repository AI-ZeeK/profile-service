/*
  Warnings:

  - You are about to drop the column `accepted_at` on the `staff_invitations` table. All the data in the column will be lost.
  - You are about to drop the column `declined_at` on the `staff_invitations` table. All the data in the column will be lost.
  - You are about to drop the column `viewed_at` on the `staff_invitations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "profiles"."staff_invitations" DROP COLUMN "accepted_at",
DROP COLUMN "declined_at",
DROP COLUMN "viewed_at",
ADD COLUMN     "actioned_at" TIMESTAMP(3);
