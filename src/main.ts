import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import bodyParser from 'body-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Use env var or default to localhost:3000
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,Cookie',
    credentials: true,
  });
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Cookie parser
  app.use(cookieParser());

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('NestJS Auth API')
    .setDescription('API for authentication and user management')
    .setVersion('1.0')
    .addTag('auth')
    .addTag('users')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  app.use(bodyParser.json());

  await app.listen(3001);
  console.log(`Application is running on: http://localhost:3001`);
}
bootstrap();

