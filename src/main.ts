import { NestFactory } from '@nestjs/core';

import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: '*',
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
