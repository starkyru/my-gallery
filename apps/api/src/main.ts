import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const jwtSecret = process.env.JWT_SECRET;
  if (
    !jwtSecret ||
    jwtSecret === 'dev-secret-change-me' ||
    jwtSecret === 'change-me-in-production'
  ) {
    if (process.env.NODE_ENV === 'production') {
      console.error('FATAL: JWT_SECRET must be set to a secure value in production');
      process.exit(1);
    }
    console.warn('WARNING: Using default JWT_SECRET — do NOT use in production');
  }

  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN
      ? [process.env.CORS_ORIGIN, 'http://localhost:3000']
      : 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT || 4000);
}
bootstrap();
