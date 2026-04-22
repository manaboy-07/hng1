/*
  Warnings:

  - You are about to drop the column `sample_size` on the `User` table. All the data in the column will be lost.
  - Added the required column `country_name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "sample_size",
ADD COLUMN     "country_name" TEXT NOT NULL;
