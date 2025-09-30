import { DatabaseService } from './database.service';

export class BaseEntity {
  protected static databaseService: DatabaseService;
  protected static tableName: string;

  static setDatabaseService(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }
  static setTableName(name: string) {
    this.tableName = name;
  }

  static async findAll() {
    return this.databaseService.query(`SELECT * FROM ${this.tableName}`);
  }

  static async findAllByFilter(filter: Record<string, any> = {}) {
    const entries = Object.entries(filter).filter(([, v]) => v !== undefined && v !== null && v !== '');
    if (entries.length === 0) {
      return this.findAll();
    }
    const whereClause = entries.map(([k]) => `${k} = ?`).join(' AND ');
    const values = entries.map(([, v]) => v);
    return this.databaseService.query(`SELECT * FROM ${this.tableName} WHERE ${whereClause}`, values);
  }

  static async findById(id: string | number) {
    const results = (await this.databaseService.query(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id],
    )) as any[];

    return results.length > 0 ? results[0] : null;
  }

  static async findByCondition(condition: Record<string, any>) {
    const keys = Object.keys(condition);
    const whereClause = keys.map((key) => `${key} = ?`).join(' AND ');
    const values = Object.values(condition);

    const results = (await this.databaseService.query(
      `SELECT * FROM ${this.tableName} WHERE ${whereClause} LIMIT 1`,
      values,
    )) as any[];

    return results.length > 0 ? results[0] : null;
  }

  static async create(data: Record<string, any>) {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.join(', ');
    const values = Object.values(data);

    const result = await this.databaseService.query(
      `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
      values,
    );

    // If caller provided an id (e.g., UUID), prefer fetching the row by that id.
    if (data.id !== undefined && data.id !== null) {
      return this.findById(data.id as string | number);
    }

    // Otherwise, for auto-increment tables, return object with insertId
    return {
      id: result['insertId'],
      ...data,
    };
  }

  static async update(id: string | number, data: Record<string, any>) {
    const keys = Object.keys(data);
    const setClause = keys.map((key) => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];

    await this.databaseService.query(
      `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`,
      values,
    );

    return this.findById(id);
  }

  static async delete(id: string | number) {
    return this.databaseService.query(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id],
    );
  }
}
