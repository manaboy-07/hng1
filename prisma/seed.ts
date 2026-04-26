import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import profiles from 'data/profiles.json';
import { PrismaClient } from 'src/generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  for (const profile of profiles.profiles) {
    await prisma.profile.upsert({
      where: { name: profile.name },
      update: {},
      create: {
        name: profile.name,
        gender: profile.gender,
        gender_probability: profile.gender_probability,
        age: profile.age,
        age_group: profile.age_group,
        country_id: profile.country_id,
        country_probability: profile.country_probability,
        country_name: profile.country_name,
      },
    });
  }
}
//npx prisma db seed

main()
  .then(() => {
    console.log('🌱 Seeding done');
  })
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(1);
  });
