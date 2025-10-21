import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina propiedades extra que no estén en el DTO
      forbidNonWhitelisted: true, // devuelve error si se envían campos no permitidos
      transform: true, // transforma payloads a los tipos definidos en los DTOs
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
