import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import profiles from 'data/profiles.json';
import { PrismaClient } from 'src/generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  for (const user of profiles.profiles) {
    await prisma.user.upsert({
      where: { name: user.name },
      update: {},
      create: {
        name: user.name,
        gender: user.gender,
        gender_probability: user.gender_probability,
        age: user.age,
        age_group: user.age_group,
        country_id: user.country_id,
        country_probability: user.country_probability,
        country_name: user.country_name,
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
