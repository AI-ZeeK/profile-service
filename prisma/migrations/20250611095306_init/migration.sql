-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "platform";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "profiles";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "roles";

-- CreateEnum
CREATE TYPE "profiles"."BusinessAccessType" AS ENUM ('CREATOR', 'PARTNER', 'VENDOR', 'CLIENT', 'INVESTOR');

-- CreateEnum
CREATE TYPE "profiles"."VerificationPurpose" AS ENUM ('EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'PASSWORD_RESET', 'TWO_FACTOR_AUTH');

-- CreateEnum
CREATE TYPE "profiles"."AccountType" AS ENUM ('ORGANIZATION', 'INDIVIDUAL');

-- CreateTable
CREATE TABLE "profiles"."users" (
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" VARCHAR(50) DEFAULT '',
    "last_name" VARCHAR(50) DEFAULT '',
    "password" TEXT DEFAULT '',
    "date_of_birth" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(20),
    "backup_phone_number" VARCHAR(20),
    "email_verified" BOOLEAN DEFAULT false,
    "phone_verified" BOOLEAN DEFAULT false,
    "kyc_verified" BOOLEAN DEFAULT false,
    "is_blocked" BOOLEAN DEFAULT false,
    "fcm_token" TEXT NOT NULL DEFAULT '',
    "refresh_token" TEXT NOT NULL DEFAULT '',
    "last_seen" TEXT NOT NULL DEFAULT 'online',
    "account_type" "profiles"."AccountType" NOT NULL DEFAULT 'INDIVIDUAL',
    "permission_level" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "profiles"."business_users" (
    "business_user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(20),
    "organization_id" UUID NOT NULL,
    "access_type" "profiles"."BusinessAccessType" NOT NULL DEFAULT 'CREATOR',
    "access_level" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "business_users_pkey" PRIMARY KEY ("business_user_id")
);

-- CreateTable
CREATE TABLE "profiles"."staff" (
    "staff_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "branch_id" UUID,
    "user_id" UUID NOT NULL,
    "role_id" UUID,
    "department_id" UUID,
    "designation" TEXT,
    "profile_complete" BOOLEAN NOT NULL DEFAULT false,
    "payroll_active" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("staff_id")
);

-- CreateTable
CREATE TABLE "profiles"."verifications" (
    "verification_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "otp_code" VARCHAR(6) NOT NULL,
    "purpose" "profiles"."VerificationPurpose" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("verification_id")
);

-- CreateTable
CREATE TABLE "platform"."platform_staff" (
    "platform_staff_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role_id" INTEGER NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_staff_pkey" PRIMARY KEY ("platform_staff_id")
);

-- CreateTable
CREATE TABLE "platform"."platform_roles" (
    "role_id" SERIAL NOT NULL,
    "role_name" VARCHAR(50),
    "description" TEXT DEFAULT '',
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "platform_roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "platform"."platform_permissions" (
    "permission_id" SERIAL NOT NULL,
    "permission" VARCHAR(50) NOT NULL,
    "description" TEXT DEFAULT '',

    CONSTRAINT "platform_permissions_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable
CREATE TABLE "platform"."platform_role_permissions" (
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,

    CONSTRAINT "platform_role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "roles"."roles" (
    "role_id" SERIAL NOT NULL,
    "role_name" VARCHAR(50),
    "description" TEXT DEFAULT '',
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "roles"."user_roles" (
    "user_id" UUID NOT NULL,
    "role_name" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_name")
);

-- CreateTable
CREATE TABLE "roles"."user_permission_restrictions" (
    "restriction_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "permission_name" VARCHAR(50) NOT NULL,
    "restriction_type" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "restricted_by" UUID NOT NULL,
    "restricted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_permission_restrictions_pkey" PRIMARY KEY ("restriction_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "profiles"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "profiles"."users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_backup_phone_number_key" ON "profiles"."users"("backup_phone_number");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "profiles"."users"("email");

-- CreateIndex
CREATE INDEX "idx_users_phone_number" ON "profiles"."users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "business_users_email_key" ON "profiles"."business_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "business_users_phone_number_key" ON "profiles"."business_users"("phone_number");

-- CreateIndex
CREATE INDEX "business_users_user_id_idx" ON "profiles"."business_users"("user_id");

-- CreateIndex
CREATE INDEX "business_users_organization_id_idx" ON "profiles"."business_users"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_users_user_id_is_active_key" ON "profiles"."business_users"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "business_users_user_id_organization_id_key" ON "profiles"."business_users"("user_id", "organization_id");

-- CreateIndex
CREATE INDEX "staff_company_id_idx" ON "profiles"."staff"("company_id");

-- CreateIndex
CREATE INDEX "staff_branch_id_idx" ON "profiles"."staff"("branch_id");

-- CreateIndex
CREATE INDEX "staff_user_id_idx" ON "profiles"."staff"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_user_id_is_active_key" ON "profiles"."staff"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_verification_user_purpose" ON "profiles"."verifications"("user_id", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "platform_roles_role_name_key" ON "platform"."platform_roles"("role_name");

-- CreateIndex
CREATE INDEX "idx_platform_roles_role_name" ON "platform"."platform_roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "platform_permissions_permission_key" ON "platform"."platform_permissions"("permission");

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"."roles"("role_name");

-- CreateIndex
CREATE INDEX "idx_roles_role_name" ON "roles"."roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_is_active_key" ON "roles"."user_roles"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "user_permission_restrictions_user_id_idx" ON "roles"."user_permission_restrictions"("user_id");

-- CreateIndex
CREATE INDEX "user_permission_restrictions_permission_name_idx" ON "roles"."user_permission_restrictions"("permission_name");

-- CreateIndex
CREATE INDEX "user_permission_restrictions_restriction_type_idx" ON "roles"."user_permission_restrictions"("restriction_type");

-- CreateIndex
CREATE UNIQUE INDEX "user_permission_restrictions_user_id_permission_name_is_act_key" ON "roles"."user_permission_restrictions"("user_id", "permission_name", "is_active");

-- AddForeignKey
ALTER TABLE "profiles"."business_users" ADD CONSTRAINT "business_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles"."staff" ADD CONSTRAINT "staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles"."verifications" ADD CONSTRAINT "verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."platform_staff" ADD CONSTRAINT "platform_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."platform_staff" ADD CONSTRAINT "platform_staff_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "platform"."platform_roles"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."platform_role_permissions" ADD CONSTRAINT "platform_role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "platform"."platform_roles"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."platform_role_permissions" ADD CONSTRAINT "platform_role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "platform"."platform_permissions"("permission_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles"."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles"."user_roles" ADD CONSTRAINT "user_roles_role_name_fkey" FOREIGN KEY ("role_name") REFERENCES "roles"."roles"("role_name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles"."user_permission_restrictions" ADD CONSTRAINT "user_permission_restrictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles"."user_permission_restrictions" ADD CONSTRAINT "user_permission_restrictions_restricted_by_fkey" FOREIGN KEY ("restricted_by") REFERENCES "profiles"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
