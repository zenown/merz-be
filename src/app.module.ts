import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { EmailModule } from './email/email.module';
import { StoreModule } from './store/store.module';
import { PlanogramModule } from './planogram/planogram.module';
import { StorageModule } from './storage/storage.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { User } from './users/entities/user.entity';
import { Planogram } from './planogram/planogram.entity';
import { Store } from './store/store.entity';
import { Submission } from './submissions/submission.entity';
import { Upload } from './submissions/upload.entity';
const DEFAULT_ADMIN = {
  email: new ConfigService().get('ADMIN_EMAIL')+'',
  password: new ConfigService().get('ADMIN_PASSWORD')+'',
}

const authenticate = async (email: string, password: string) => {
  console.log(email, password)
  console.log('--------------------------------',new ConfigService().get('ADMIN_PASSWORD'))
  console.log(DEFAULT_ADMIN.email, DEFAULT_ADMIN.password)
  if (email === new ConfigService().get('ADMIN_EMAIL') && password === new ConfigService().get('ADMIN_PASSWORD')) {
    return Promise.resolve(DEFAULT_ADMIN)
  }
  return null
}
@Module({
  imports: [
    // AdminJS version 7 is ESM-only. In order to import it, you have to use dynamic imports.
    import('@adminjs/nestjs').then(async ({ AdminModule }) => {
      // Dynamically import AdminJS and TypeORM adapter
      const AdminJS = (await import('adminjs')).default;
      const AdminJSTypeorm = await import('@adminjs/typeorm');
      
      // Register the TypeORM adapter
      AdminJS.registerAdapter({
        Resource: AdminJSTypeorm.Resource,
        Database: AdminJSTypeorm.Database,
      });
      
      return AdminModule.createAdminAsync({
        useFactory: () => ({
          adminJsOptions: {
            rootPath: '/admin',
            resources: [User, Planogram, Store, Submission, Upload],
          },
          auth: {
            authenticate,
            cookieName: 'adminjs',
            cookiePassword: 'secret'
          },
          sessionOptions: {
            resave: true,
            saveUninitialized: true,
            secret: 'secret'
          },
        }),
      });
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [User, Planogram, Store, Submission, Upload],
        synchronize: false, // Set to false in production
        logging: process.env.NODE_ENV === 'development',
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    StorageModule.register({
      storageType: (process.env.STORAGE_TYPE as 'local' | 's3') || 'local',
      s3: {
        bucketName: process.env.AWS_S3_BUCKET || process.env.S3_BUCKET_NAME || '',
        region: process.env.AWS_REGION || process.env.S3_REGION || '',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY || '',
        endpoint: process.env.AWS_ENDPOINT || process.env.S3_ENDPOINT || '',
      },
      local: {
        uploadDir: process.env.LOCAL_UPLOAD_DIR || 'public',
      },
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    EmailModule,
    StoreModule,
    PlanogramModule,
    SubmissionsModule,
  ],
})
export class AppModule {}

