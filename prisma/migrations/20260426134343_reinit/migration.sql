/*
  Warnings:

  - You are about to drop the `Users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Users";

-- CreateTable
CREATE TABLE "Profile" (
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

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_name_key" ON "Profile"("name");

-- CreateIndex
CREATE INDEX "Profile_gender_idx" ON "Profile"("gender");

-- CreateIndex
CREATE INDEX "Profile_age_idx" ON "Profile"("age");

-- CreateIndex
CREATE INDEX "Profile_country_id_idx" ON "Profile"("country_id");

-- CreateIndex
CREATE INDEX "Profile_age_group_idx" ON "Profile"("age_group");

-- CreateIndex
CREATE INDEX "Profile_gender_probability_idx" ON "Profile"("gender_probability");

-- CreateIndex
CREATE INDEX "Profile_country_probability_idx" ON "Profile"("country_probability");

-- CreateIndex
CREATE INDEX "Profile_createdAt_idx" ON "Profile"("createdAt");

-- CreateIndex
CREATE INDEX "Profile_gender_age_idx" ON "Profile"("gender", "age");

-- CreateIndex
CREATE INDEX "Profile_country_id_age_idx" ON "Profile"("country_id", "age");

-- CreateIndex
CREATE INDEX "Profile_gender_country_id_idx" ON "Profile"("gender", "country_id");
