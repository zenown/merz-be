import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable CORS for both frontend and backoffice URLs
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.BACKOFFICE_URL,
    'http://localhost:5173', // Explicitly add your frontend URL
    'http://localhost:3000', // Common frontend port
    'http://localhost:3001', // Common backoffice port
  ].filter((url): url is string => Boolean(url)); // Remove any undefined values and ensure type safety

  console.log('Allowed CORS origins:', allowedOrigins);

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
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
    .addTag('storage')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.use(bodyParser.json());

  await app.listen(process.env.PORT || 3002);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

