import { DatabaseService } from './database.service';
import { getMetadataArgsStorage } from 'typeorm';

export class BaseEntity {
  protected static databaseService: DatabaseService;
  protected static tableName: string;

  static setDatabaseService(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }
  static setTableName(name: string) {
    this.tableName = name;
  }

  // Helper method to get column name for a field
  protected static getColumnName(fieldName: string): string {
    const metadata = getMetadataArgsStorage();
    const columns = metadata.columns.filter(col => col.target === this);
    
    const column = columns.find(col => col.propertyName === fieldName);
    if (column && column.options && column.options.name) {
      return column.options.name;
    }
    
    // If no explicit column name mapping, return the field name
    return fieldName;
  }

  // Helper method to get all column mappings for this entity
  protected static getColumnMappings(): Record<string, string> {
    const metadata = getMetadataArgsStorage();
    const columns = metadata.columns.filter(col => col.target === this);
    const mappings: Record<string, string> = {};
    
    columns.forEach(col => {
      const fieldName = col.propertyName;
      const columnName = col.options && col.options.name ? col.options.name : fieldName;
      mappings[fieldName] = columnName;
    });
    
    return mappings;
  }

  static async findAll() {
    return this.databaseService.query(`SELECT * FROM ${this.tableName}`);
  }

  static async findAllByFilter(filter: Record<string, any> = {}) {
    const entries = Object.entries(filter).filter(([, v]) => v !== undefined && v !== null && v !== '');
    if (entries.length === 0) {
      return this.findAll();
    }
    const columnMappings = this.getColumnMappings();
    const whereClause = entries.map(([k]) => `${columnMappings[k] || k} = ?`).join(' AND ');
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
    const columnMappings = this.getColumnMappings();
    const whereClause = keys.map((key) => `${columnMappings[key] || key} = ?`).join(' AND ');
    const values = Object.values(condition);

    const results = (await this.databaseService.query(
      `SELECT * FROM ${this.tableName} WHERE ${whereClause} LIMIT 1`,
      values,
    )) as any[];

    return results.length > 0 ? results[0] : null;
  }

  static async create(data: Record<string, any>) {
    const keys = Object.keys(data);
    const columnMappings = this.getColumnMappings();
    
    // Map field names to database column names
    const columns = keys.map(key => columnMappings[key] || key);
    const placeholders = keys.map(() => '?').join(', ');
    const columnNames = columns.join(', ');
    const values = Object.values(data).map(value => value === null || value === undefined ? null : value);



    const result = await this.databaseService.query(
      `INSERT INTO ${this.tableName} (${columnNames}) VALUES (${placeholders})`,
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
    const columnMappings = this.getColumnMappings();
    
    // Map field names to database column names
    const setClause = keys.map((key) => `${columnMappings[key] || key} = ?`).join(', ');
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

  static async findAllWithSearchAndSort(options: {
    search?: string;
    searchColumns?: string[];
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    filter?: Record<string, any>;
  } = {}) {
    const { search, searchColumns = [], sortBy, sortOrder = 'ASC', filter = {} } = options;
    
    let query = `SELECT * FROM ${this.tableName}`;
    const conditions: string[] = [];
    const values: any[] = [];

    // Add filter conditions
    const filterEntries = Object.entries(filter).filter(([, v]) => v !== undefined && v !== null && v !== '');
    if (filterEntries.length > 0) {
      const columnMappings = this.getColumnMappings();
      const filterConditions = filterEntries.map(([k]) => `${columnMappings[k] || k} = ?`);
      conditions.push(...filterConditions);
      values.push(...filterEntries.map(([, v]) => v));
    }

    // Add search conditions
    if (search && searchColumns.length > 0) {
      const searchConditions = searchColumns.map(column => `${column} LIKE ?`);
      conditions.push(`(${searchConditions.join(' OR ')})`);
      values.push(...searchColumns.map(() => `%${search}%`));
    }

    // Build WHERE clause
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Add ORDER BY clause
    if (sortBy) {
      query += ` ORDER BY ${sortBy} ${sortOrder}`;
    }

    return this.databaseService.query(query, values);
  }
}
