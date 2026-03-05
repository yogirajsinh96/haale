import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  // Serve built frontend static assets (JS, CSS, images, etc.) from /public
  const publicPath = join(__dirname, '../', 'public');
  app.useStaticAssets(publicPath);

  // ─── CORS ────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: true, // allow all origins
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ─── Global exception filter ─────────────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());

  // ─── Global validation ───────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── SPA Fallback ────────────────────────────────────────────────────────
  // IMPORTANT: Must be registered on the raw Express instance BEFORE app.listen().
  //
  // The problem: NestJS's AllExceptionsFilter catches the NotFoundException
  // thrown for unknown routes and returns a JSON 404 — before any NestJS-level
  // wildcard route can respond. Registering this directly on the underlying
  // Express instance bypasses NestJS routing entirely for non-API paths.
  //
  // Result: GET /login, /dashboard, /settings etc. → serve index.html
  //         GET /api/... → handled by NestJS controllers as normal
  const server = app.getHttpAdapter().getInstance();
  server.get(/^(?!\/api).*$/, (_req: any, res: any) => {
    res.sendFile(join(publicPath, 'index.html'));
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`\n🚀 haale API running on http://localhost:${port}`);
  console.log(`   ENV: ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`   DB:  ${process.env.DB_PATH ?? './haale.db'}\n`);
}

bootstrap();