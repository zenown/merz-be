import { UmzugStorage, MigrationMeta } from 'umzug';
import { DatabaseService } from './database.service';

interface MySQLStorageOptions {
  dbService: DatabaseService;
  tableName: string;
}

export class MySQLStorage implements UmzugStorage {
  private dbService: DatabaseService;
  private tableName: string;

  constructor(options: MySQLStorageOptions) {
    this.dbService = options.dbService;
    this.tableName = options.tableName;
  }

  async logMigration({ name }: MigrationMeta): Promise<void> {
    await this.dbService.query(
      `INSERT INTO ${this.tableName} (name) VALUES (?);`,
      [name],
    );
  }

  async unlogMigration({ name }: MigrationMeta): Promise<void> {
    await this.dbService.query(
      `DELETE FROM ${this.tableName} WHERE name = ?;`,
      [name],
    );
  }

  async executed(): Promise<string[]> {
    const result = await this.dbService.query(
      `SELECT name FROM ${this.tableName} ORDER BY executed_at ASC;`,
    );
    return (result as any).map((row: any) => row.name);
  }
}
