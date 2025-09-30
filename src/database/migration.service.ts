import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Umzug } from 'umzug';
import * as path from 'path';
import * as fs from 'fs';
import { DatabaseService } from './database.service';
import { MySQLStorage } from './mysql.storage';

@Injectable()
export class MigrationService implements OnModuleInit {
  private migrator: Umzug<{ connection: DatabaseService }>;

  constructor(
    private databaseService: DatabaseService,
    private configService: ConfigService,
  ) {
    // Initialize the migrator but don't run migrations yet
    const migrationsPath = path.join(__dirname, '../migrations');

    if (!fs.existsSync(migrationsPath)) {
      fs.mkdirSync(migrationsPath, { recursive: true });
    }

    this.migrator = new Umzug({
      migrations: {
        glob: ['../migrations/*.js', { cwd: __dirname }],
        resolve: ({ name, path, context }) => {
          const migration = require(path + '');
          return {
            name,
            up: async () => migration.up(context.connection),
            down: async () => migration.down(context.connection),
          };
        },
      },
      context: { connection: this.databaseService },
      storage: new MySQLStorage({
        dbService: this.databaseService,
        tableName: 'migrations',
      }),
      logger: console,
    });
  }
  async initializeMigrationTable() {
    try {
      // We can't access storage directly, but we can execute a query
      // to create the migrations table manually
      await this.databaseService.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Migrations table created or already exists');
      return true;
    } catch (error) {
      console.error('Failed to initialize migrations table:', error);
      throw error;
    }
  }

  async getMigrationStatus() {
    try {
      // Get executed migrations through Umzug's API
      const executed = await this.migrator.executed();
      console.log('Executed migrations:', executed);

      // Get pending migrations through Umzug's API
      const pending = await this.migrator.pending();
      console.log(
        'Pending migrations:',
        pending.map((m) => m.name),
      );

      return {
        executed: executed.map((m) => m.name),
        pending: pending.map((m) => m.name),
      };
    } catch (error) {
      console.error('Error getting migration status:', error);
      throw error;
    }
  }
  async onModuleInit() {
    // Create migrations table if it doesn't exist
    await this.databaseService.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async runMigrations() {
    try {
      // Use Umzug's up() method to run and track migrations
      const migrations = await this.migrator.up();
      console.log(
        'Successfully ran migrations:',
        migrations.map((m) => m.name),
      );
      return migrations;
    } catch (error) {
      console.error('Failed to run migrations:', error);
      throw error;
    }
  }

  async revertLastMigration() {
    try {
      // Validate connection before running
      await this.databaseService.query('SELECT 1');
      return this.migrator.down();
    } catch (error) {
      console.error(
        'Cannot revert migration - database connection issue:',
        error,
      );
      throw error;
    }
  }
}
