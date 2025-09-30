import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { EmailModule } from './email/email.module';
import { StoreModule } from './store/store.module';
import { PlanogramModule } from './planogram/planogram.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    StorageModule.register({
      storageType: process.env.STORAGE_TYPE as 'local' | 's3',
      s3: {
        bucketName: process.env.S3_BUCKET_NAME || '',
        region: process.env.S3_REGION || '',
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        endpoint: process.env.S3_ENDPOINT || '',
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
  ],
})
export class AppModule {}

