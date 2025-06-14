/*
  Warnings:

  - You are about to drop the column `department_id` on the `staff` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "profiles"."staff" DROP COLUMN "department_id";

-- CreateTable
CREATE TABLE "profiles"."staff_departments" (
    "staff_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_departments_pkey" PRIMARY KEY ("staff_id","department_id")
);

-- CreateIndex
CREATE INDEX "staff_departments_staff_id_idx" ON "profiles"."staff_departments"("staff_id");

-- CreateIndex
CREATE INDEX "staff_departments_department_id_idx" ON "profiles"."staff_departments"("department_id");

-- CreateIndex
CREATE INDEX "staff_departments_is_active_idx" ON "profiles"."staff_departments"("is_active");

-- AddForeignKey
ALTER TABLE "profiles"."staff_departments" ADD CONSTRAINT "staff_departments_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "profiles"."staff"("staff_id") ON DELETE CASCADE ON UPDATE CASCADE;
