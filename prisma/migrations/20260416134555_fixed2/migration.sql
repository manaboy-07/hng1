/*
  Warnings:

  - You are about to drop the column `countryId` on the `User` table. All the data in the column will be lost.
  - Added the required column `country_id` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "countryId",
ADD COLUMN     "country_id" TEXT NOT NULL;
