-- CreateEnum
CREATE TYPE "profiles"."InvitationStatus" AS ENUM ('PENDING', 'VIEWED', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateTable
CREATE TABLE "profiles"."staff_invitations" (
    "invitation_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "branch_id" UUID,
    "department_id" UUID,
    "role_id" UUID,
    "email" VARCHAR(255) NOT NULL,
    "invitation_code" VARCHAR(100) NOT NULL,
    "status" "profiles"."InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invited_by" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "viewed_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "declined_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_invitations_pkey" PRIMARY KEY ("invitation_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_invitations_invitation_code_key" ON "profiles"."staff_invitations"("invitation_code");

-- CreateIndex
CREATE INDEX "staff_invitations_invitation_code_idx" ON "profiles"."staff_invitations"("invitation_code");

-- CreateIndex
CREATE INDEX "staff_invitations_email_idx" ON "profiles"."staff_invitations"("email");

-- CreateIndex
CREATE INDEX "staff_invitations_company_id_idx" ON "profiles"."staff_invitations"("company_id");

-- CreateIndex
CREATE INDEX "staff_invitations_status_idx" ON "profiles"."staff_invitations"("status");

-- CreateIndex
CREATE INDEX "staff_invitations_expires_at_idx" ON "profiles"."staff_invitations"("expires_at");
