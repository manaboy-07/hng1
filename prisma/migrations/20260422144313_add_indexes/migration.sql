-- CreateIndex
CREATE INDEX "User_gender_idx" ON "User"("gender");

-- CreateIndex
CREATE INDEX "User_age_idx" ON "User"("age");

-- CreateIndex
CREATE INDEX "User_country_id_idx" ON "User"("country_id");

-- CreateIndex
CREATE INDEX "User_age_group_idx" ON "User"("age_group");

-- CreateIndex
CREATE INDEX "User_gender_probability_idx" ON "User"("gender_probability");

-- CreateIndex
CREATE INDEX "User_country_probability_idx" ON "User"("country_probability");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_gender_age_idx" ON "User"("gender", "age");

-- CreateIndex
CREATE INDEX "User_country_id_age_idx" ON "User"("country_id", "age");

-- CreateIndex
CREATE INDEX "User_gender_country_id_idx" ON "User"("gender", "country_id");
