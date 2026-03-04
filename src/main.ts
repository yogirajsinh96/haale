import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: true, // allow all origins
    credentials: true,
  });

  app.setGlobalPrefix('api');

    // Serve built frontend from /public
  const publicPath = join(__dirname, '../', 'public');
  app.useStaticAssets(publicPath);


  // ─── CORS ────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: [
      'http://localhost:5173',  // Vite dev server
      'http://localhost:4173',  // Vite preview
      'http://localhost:3001',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ─── Global exception filter ─────────────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());

  // ─── Global validation ───────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,           // auto-transform payloads to DTO classes
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );



  // SPA fallback — any route that doesn't start with /api gets index.html
  // This lets React Router handle /dashboard, /projects, /settings etc.
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
