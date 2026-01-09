import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  console.log('[DEBUG] Creating Nest App...');
  const app = await NestFactory.create(AppModule);
  // Increase payload limit for Base64 images
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Enable CORS for Flutter Web
  app.enableCors();

  console.log('[DEBUG] App Created. Listening on 0.0.0.0:3000...');
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`[DEBUG] Application is running on: ${await app.getUrl()}`);
}
bootstrap();
