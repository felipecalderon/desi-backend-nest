import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.useGlobalInterceptors(new ResponseInterceptor(Reflector.prototype));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina propiedades extra que no estén en el DTO
      forbidNonWhitelisted: true, // devuelve error si se envían campos no permitidos
      transform: true, // transforma payloads a los tipos definidos en cada DTOs
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('D3SI API')
    .setDescription('Backend API para la aplicación D3SI')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
