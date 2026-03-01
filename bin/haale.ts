#!/usr/bin/env node
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(5678);
  console.log("Haale running on http://localhost:5678");
}

bootstrap();