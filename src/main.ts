import 'dotenv/config';
import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidUnknownValues: false,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);

  Logger.log(`PayBite API running on http://localhost:${port}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});