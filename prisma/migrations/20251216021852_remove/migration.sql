-- CreateTable
CREATE TABLE "roles"."business_user_roles" (
    "business_user_id" UUID NOT NULL,
    "organization_role_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "business_user_roles_pkey" PRIMARY KEY ("business_user_id")
);

-- AddForeignKey
ALTER TABLE "roles"."business_user_roles" ADD CONSTRAINT "business_user_roles_business_user_id_fkey" FOREIGN KEY ("business_user_id") REFERENCES "profiles"."business_users"("business_user_id") ON DELETE CASCADE ON UPDATE CASCADE;
