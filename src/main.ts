import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import * as basicAuth from 'express-basic-auth';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const PORT = process.env.PORT;
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie'],
    credentials: true,
  });

  app.use(cookieParser());

  app.use(
    session({
      secret: process.env.SESSION_SECRET_KEY,
      resave: false,
      saveUninitialized: true,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Test-task: comments')
      .build();

    const swaggerCred = {
      login: process.env.SWAGGER_LOGIN,
      password: process.env.SWAGGER_PASSWORD,
    };

    app.use(
      ['/api'],
      basicAuth({
        challenge: true,
        users: { [swaggerCred.login]: swaggerCred.password },
      }),
    );

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
bootstrap();
