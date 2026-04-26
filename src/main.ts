import { NestFactory } from '@nestjs/core';
import * as passport from 'passport';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //app.use(passport.initialize());

  app.enableCors({
    origin: '*',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
