-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT,
    "gender_probability" DOUBLE PRECISION NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "age" INTEGER NOT NULL,
    "age_group" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "country_probability" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
