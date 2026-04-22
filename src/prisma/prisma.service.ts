import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { PrismaClient } from 'src/generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('Prisma connected to database manasseh');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Prisma disconnected from database');
  }
}

