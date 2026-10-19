import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('WavelengthBootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for Next.js web app, Capacitor mobile apps, and Electron desktop apps
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable strict validation pipes with auto-transform
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`🎧 Wavelength API server running at http://localhost:${port}`);
  logger.log(`🔍 Health check: http://localhost:${port}/health`);
  logger.log(`🎵 Providers & Search: http://localhost:${port}/api/search?q=chill`);
}

bootstrap();
