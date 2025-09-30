// scripts/run-migrations.js
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { MigrationService } = require('../dist/database/migration.service');
const { DatabaseService } = require('../dist/database/database.service');

async function runMigrations() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dbService = app.get(DatabaseService);
    const migrationService = app.get(MigrationService);
    
    // Make sure DB connection is ready
    try {
      await dbService.query('SELECT 1');
      console.log('Database connection verified.');
    } catch (error) {
      console.error('Database connection not ready:', error);
      await app.close();
      process.exit(1);
    }
    
    console.log('Running migrations...');
    await migrationService.runMigrations();
    console.log('Migrations complete!');
    
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();