import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RawServerDefault } from 'fastify';

export const swaggerConfig = (
  app: NestFastifyApplication<RawServerDefault>,
) => {
  const config = new DocumentBuilder()
    .setTitle('D3SI API')
    .setDescription('Backend API para la aplicación D3SI')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
  });
};
