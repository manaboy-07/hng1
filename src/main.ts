import { NestFactory } from '@nestjs/core';
import * as passport from 'passport';
import * as dotenv from 'dotenv';

import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ThrottlerExceptionFilter } from './auth/guards/rate-limit.guard';
import { LoggingInterceptor } from './auth/guards/log.guard';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalFilters(new ThrottlerExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.enableCors({
    origin: true,
    credentials: true,
  });
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
