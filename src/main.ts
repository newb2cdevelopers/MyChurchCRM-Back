import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Global Validation Pipe - Validates DTOs automatically
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Auto-transform payloads to DTO instances
      whitelist: true, // Strip properties not defined in DTO
      forbidNonWhitelisted: true, // Throw error for extra properties
      transformOptions: {
        enableImplicitConversion: true, // Auto-convert primitive types (string to number, etc.)
      },
    }),
  );

  const options = new DocumentBuilder()
    .setTitle('CRM Gospel')
    .setDescription('Api dosc')
    .setVersion('0.0.1')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'Token' },
      'access token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, options);
  const swaggerPath = 'api/docs';
  SwaggerModule.setup(swaggerPath, app, document);

  const port = parseInt(process.env.PORT) || 4000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(
    `Swagger documentation available at: http://localhost:${port}/${swaggerPath}`,
  );
}
bootstrap();
