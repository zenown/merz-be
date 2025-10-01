import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { MigrationService } from './migration.service';
import { EntityInitializerService } from './entity-initializer.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [DatabaseService, MigrationService, EntityInitializerService],
  exports: [DatabaseService, MigrationService, EntityInitializerService],
})
export class DatabaseModule {}

