import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const PORT = process.env.PORT;
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.use(
    session({
      secret: process.env.SESSION_SECRET_KEY,
      resave: false,
      saveUninitialized: true,
    }),
  );

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
bootstrap();
