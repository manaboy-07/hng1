/*
  Warnings:

  - You are about to drop the column `age` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `age_group` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `country_id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `country_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `country_probability` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `gender_probability` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[github_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `github_id` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ANALYST');

-- DropIndex
DROP INDEX "User_age_group_idx";

-- DropIndex
DROP INDEX "User_age_idx";

-- DropIndex
DROP INDEX "User_country_id_age_idx";

-- DropIndex
DROP INDEX "User_country_id_idx";

-- DropIndex
DROP INDEX "User_country_probability_idx";

-- DropIndex
DROP INDEX "User_createdAt_idx";

-- DropIndex
DROP INDEX "User_gender_age_idx";

-- DropIndex
DROP INDEX "User_gender_country_id_idx";

-- DropIndex
DROP INDEX "User_gender_idx";

-- DropIndex
DROP INDEX "User_gender_probability_idx";

-- DropIndex
DROP INDEX "User_name_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "age",
DROP COLUMN "age_group",
DROP COLUMN "country_id",
DROP COLUMN "country_name",
DROP COLUMN "country_probability",
DROP COLUMN "gender",
DROP COLUMN "gender_probability",
DROP COLUMN "name",
ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "github_id" TEXT NOT NULL,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'ANALYST',
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT,
    "gender_probability" DOUBLE PRECISION NOT NULL,
    "country_name" TEXT NOT NULL,
    "country_id" TEXT NOT NULL,
    "country_probability" DOUBLE PRECISION NOT NULL,
    "age" INTEGER,
    "age_group" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_name_key" ON "Users"("name");

-- CreateIndex
CREATE INDEX "Users_gender_idx" ON "Users"("gender");

-- CreateIndex
CREATE INDEX "Users_age_idx" ON "Users"("age");

-- CreateIndex
CREATE INDEX "Users_country_id_idx" ON "Users"("country_id");

-- CreateIndex
CREATE INDEX "Users_age_group_idx" ON "Users"("age_group");

-- CreateIndex
CREATE INDEX "Users_gender_probability_idx" ON "Users"("gender_probability");

-- CreateIndex
CREATE INDEX "Users_country_probability_idx" ON "Users"("country_probability");

-- CreateIndex
CREATE INDEX "Users_createdAt_idx" ON "Users"("createdAt");

-- CreateIndex
CREATE INDEX "Users_gender_age_idx" ON "Users"("gender", "age");

-- CreateIndex
CREATE INDEX "Users_country_id_age_idx" ON "Users"("country_id", "age");

-- CreateIndex
CREATE INDEX "Users_gender_country_id_idx" ON "Users"("gender", "country_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_github_id_key" ON "User"("github_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_github_id_idx" ON "User"("github_id");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
